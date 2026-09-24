import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { ZodError, z } from 'zod';
import { deleteAccount, finishOAuth, logout, startOAuth } from './auth';
import { statusForModerationAction } from './moderation';
import { getSessionUser, isResponse, requireUser } from './security';
import type { CommunityKind, Env, Provider, SessionUser } from './types';
import { parsePayload, slugify, validateCatalogReferences } from './validation';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  c.header('X-Request-ID', requestId);
  const started = Date.now();
  try {
    await next();
  } finally {
    console.log(
      JSON.stringify({
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - started,
      }),
    );
  }
});

app.use('*', async (c, next) =>
  cors({
    origin: (origin) => {
      const allowed = c.env.ALLOWED_ORIGINS.split(',').map((value) =>
        value.trim(),
      );
      return allowed.includes(origin) ? origin : c.env.APP_ORIGIN;
    },
    allowHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Turnstile-Token'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 86400,
  })(c, next),
);

app.get('/v1/health', (c) => c.json({ ok: true }));

app.get('/v1/users/:id', async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT id, display_name, avatar_url FROM users WHERE id = ? AND deleted_at IS NULL',
  )
    .bind(c.req.param('id'))
    .first<{ id: string; display_name: string; avatar_url: string | null }>();
  if (!row) return c.json({ error: 'Not found' }, 404);
  const stats = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(kind = 'team'), 0) AS teams,
            COALESCE(SUM(kind = 'tier_list'), 0) AS tier_lists,
            COALESCE(SUM(score), 0) AS upvotes
       FROM community_items WHERE owner_user_id = ? AND status = 'published'`,
  )
    .bind(row.id)
    .first<{ teams: number; tier_lists: number; upvotes: number }>();
  return c.json({
    user: {
      id: row.id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      stats: {
        teams: stats?.teams ?? 0,
        tierLists: stats?.tier_lists ?? 0,
        upvotes: stats?.upvotes ?? 0,
      },
    },
  });
});

app.get('/v1/auth/me', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ user: null });
  const identities = await c.env.DB.prepare(
    'SELECT provider, username FROM oauth_identities WHERE user_id = ? ORDER BY provider',
  )
    .bind(user.id)
    .all<{ provider: Provider; username: string }>();
  const unread = await c.env.DB.prepare(
    `SELECT COUNT(*) AS count FROM reports r JOIN users u ON u.id = ?
      WHERE r.reporter_user_id = ? AND r.status != 'open' AND r.resolved_at > u.reports_seen_at`,
  )
    .bind(user.id, user.id)
    .first<{ count: number }>();
  return c.json({
    user: {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      primaryProvider: user.primaryProvider,
      identities: identities.results,
      unreadReportCount: unread?.count ?? 0,
    },
    csrfToken: user.csrfToken,
  });
});

for (const provider of ['github', 'discord'] as const) {
  app.get(`/v1/auth/${provider}/start`, (c) => startOAuth(c, provider));
  app.get(`/v1/auth/${provider}/callback`, (c) => finishOAuth(c, provider));
}

app.post('/v1/auth/logout', async (c) => {
  const user = await requireUser(c);
  if (isResponse(user)) return user;
  return logout(c, user);
});

app.delete('/v1/auth/me', async (c) => {
  const user = await requireUser(c);
  if (isResponse(user)) return user;
  return deleteAccount(c, user);
});

for (const provider of ['github', 'discord'] as const) {
  app.delete(`/v1/auth/${provider}/unlink`, async (c) => {
    const user = await requireUser(c);
    if (isResponse(user)) return user;
    const identities = await c.env.DB.prepare(
      'SELECT provider FROM oauth_identities WHERE user_id = ?',
    )
      .bind(user.id)
      .all<{ provider: Provider }>();
    if (identities.results.length <= 1)
      return c.json({ error: 'Cannot unlink your only linked identity' }, 400);
    if (!identities.results.some((row) => row.provider === provider))
      return c.json({ error: 'Identity is not linked' }, 404);
    await c.env.DB.prepare(
      'DELETE FROM oauth_identities WHERE user_id = ? AND provider = ?',
    )
      .bind(user.id, provider)
      .run();
    if (user.primaryProvider === provider) {
      const remaining = await c.env.DB.prepare(
        'SELECT provider, username, avatar_url FROM oauth_identities WHERE user_id = ?',
      )
        .bind(user.id)
        .first<{
          provider: Provider;
          username: string;
          avatar_url: string | null;
        }>();
      if (remaining) {
        await c.env.DB.prepare(
          'UPDATE users SET primary_provider = ?, display_name = ?, avatar_url = ?, updated_at = ? WHERE id = ?',
        )
          .bind(
            remaining.provider,
            remaining.username,
            remaining.avatar_url,
            Math.floor(Date.now() / 1000),
            user.id,
          )
          .run();
      }
    }
    return c.json({ ok: true });
  });
}

app.patch('/v1/auth/primary', async (c) => {
  const user = await requireUser(c);
  if (isResponse(user)) return user;
  const body = await c.req.json().catch(() => null);
  const provider = (body as { provider?: unknown } | null)?.provider;
  if (provider !== 'github' && provider !== 'discord')
    return c.json({ error: 'Invalid provider' }, 400);
  if (user.primaryProvider === provider) return c.json({ ok: true });
  const identity = await c.env.DB.prepare(
    'SELECT username, avatar_url FROM oauth_identities WHERE user_id = ? AND provider = ?',
  )
    .bind(user.id, provider)
    .first<{ username: string; avatar_url: string | null }>();
  if (!identity) return c.json({ error: 'Identity is not linked' }, 404);
  await c.env.DB.prepare(
    'UPDATE users SET primary_provider = ?, display_name = ?, avatar_url = ?, updated_at = ? WHERE id = ?',
  )
    .bind(
      provider,
      identity.username,
      identity.avatar_url,
      Math.floor(Date.now() / 1000),
      user.id,
    )
    .run();
  return c.json({ ok: true });
});

export function routeKind(value: string): CommunityKind {
  if (value === 'teams') return 'team';
  if (value === 'tier-lists') return 'tier_list';
  throw new HTTPException(404);
}

export function encodeCursor(row: {
  score: number;
  created_at: number;
  id: string;
}): string {
  return btoa(JSON.stringify([row.score, row.created_at, row.id]))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

export function decodeCursor(
  value: string | undefined,
): [number, number, string] | null {
  if (!value) return null;
  try {
    const padded =
      value.replaceAll('-', '+').replaceAll('_', '/') +
      '='.repeat((4 - (value.length % 4)) % 4);
    const parsed: unknown = JSON.parse(atob(padded));
    if (
      !Array.isArray(parsed) ||
      parsed.length !== 3 ||
      !Number.isInteger(parsed[0]) ||
      !Number.isInteger(parsed[1]) ||
      typeof parsed[2] !== 'string'
    )
      return null;
    return parsed as [number, number, string];
  } catch {
    return null;
  }
}

interface ItemRow {
  id: string;
  kind: CommunityKind;
  slug: string;
  title: string;
  owner_user_id: string;
  content_type: string;
  facet: string;
  payload_json: string;
  score: number;
  status: 'published' | 'hidden' | 'deleted';
  revision: number;
  created_at: number;
  updated_at: number;
  display_name: string;
  avatar_url: string | null;
  viewer_voted: number;
}

function presentItem(row: ItemRow, viewerId: string | null) {
  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    payload: JSON.parse(row.payload_json) as unknown,
    author: {
      id: row.owner_user_id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
    },
    score: row.score,
    status: row.status,
    viewerHasUpvoted: Boolean(row.viewer_voted),
    viewerOwns: viewerId === row.owner_user_id,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type ApiContext = Context<{ Bindings: Env }>;

async function listItems(c: ApiContext, kind: CommunityKind) {
  const viewer = await getSessionUser(c);
  const sort = c.req.query('sort') === 'new' ? 'new' : 'top';
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(c.req.query('limit') ?? '24', 10) || 24),
  );
  const cursor = decodeCursor(c.req.query('cursor'));
  if (c.req.query('cursor') && !cursor)
    return c.json({ error: 'Invalid cursor' }, 400);
  const isModerator = viewer?.role === 'moderator';
  const status =
    isModerator && c.req.query('status') === 'hidden' ? 'hidden' : 'published';
  const conditions = ['i.kind = ?', 'i.status = ?'];
  const values: unknown[] = [kind, status];
  const contentType = c.req.query('contentType');
  const facet = c.req.query('facet');
  const search = c.req.query('q')?.trim();
  const owner = c.req.query('owner');
  if (owner) {
    conditions.push('i.owner_user_id = ?');
    values.push(owner);
  }
  if (contentType) {
    conditions.push('i.content_type = ?');
    values.push(contentType);
  }
  if (facet) {
    conditions.push('i.facet = ?');
    values.push(facet);
  }
  if (search) {
    conditions.push(
      "(i.title LIKE ? ESCAPE '\\' OR json_extract(i.payload_json, '$.description') LIKE ? ESCAPE '\\' OR u.display_name LIKE ? ESCAPE '\\')",
    );
    const escaped = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    values.push(escaped, escaped, escaped);
  }
  const filterConditions = [...conditions];
  const filterValues = [...values];
  if (cursor) {
    if (sort === 'top') {
      conditions.push(
        '(i.score < ? OR (i.score = ? AND i.created_at < ?) OR (i.score = ? AND i.created_at = ? AND i.id < ?))',
      );
      values.push(
        cursor[0],
        cursor[0],
        cursor[1],
        cursor[0],
        cursor[1],
        cursor[2],
      );
    } else {
      conditions.push('(i.created_at < ? OR (i.created_at = ? AND i.id < ?))');
      values.push(cursor[1], cursor[1], cursor[2]);
    }
  }
  const order =
    sort === 'top'
      ? 'i.score DESC, i.created_at DESC, i.id DESC'
      : 'i.created_at DESC, i.id DESC';
  const query = `SELECT i.*, u.display_name, u.avatar_url,
    EXISTS(SELECT 1 FROM votes v WHERE v.item_id = i.id AND v.user_id = ?) AS viewer_voted
    FROM community_items i JOIN users u ON u.id = i.owner_user_id
    WHERE ${conditions.join(' AND ')} ORDER BY ${order} LIMIT ?`;
  const result = await c.env.DB.prepare(query)
    .bind(viewer?.id ?? '', ...values, limit + 1)
    .all<ItemRow>();
  // The total ignores the cursor, so it's only computed once, on the first page.
  const totalRow = cursor
    ? null
    : await c.env.DB.prepare(
        `SELECT COUNT(*) AS total FROM community_items i
         JOIN users u ON u.id = i.owner_user_id WHERE ${filterConditions.join(' AND ')}`,
      )
        .bind(...filterValues)
        .first<{ total: number }>();
  const rows = result.results;
  const hasMore = rows.length > limit;
  const visible = rows.slice(0, limit);
  const last = visible.at(-1);
  return c.json({
    items: visible.map((row) => presentItem(row, viewer?.id ?? null)),
    nextCursor: hasMore && last ? encodeCursor(last) : null,
    total: totalRow?.total ?? null,
  });
}

async function getItem(c: ApiContext, kind: CommunityKind, id: string) {
  const viewer = await getSessionUser(c);
  const includeHidden = viewer?.role === 'moderator';
  const row = await c.env.DB.prepare(
    `SELECT i.*, u.display_name, u.avatar_url,
    EXISTS(SELECT 1 FROM votes v WHERE v.item_id = i.id AND v.user_id = ?) AS viewer_voted
    FROM community_items i JOIN users u ON u.id = i.owner_user_id
    WHERE i.id = ? AND i.kind = ? AND ${includeHidden ? "i.status != 'deleted'" : "i.status = 'published'"}`,
  )
    .bind(viewer?.id ?? '', id, kind)
    .first<ItemRow>();
  return row
    ? c.json({ item: presentItem(row, viewer?.id ?? null) })
    : c.json({ error: 'Not found' }, 404);
}

async function verifyTurnstile(c: ApiContext): Promise<Response | null> {
  const token = c.req.header('X-Turnstile-Token');
  if (!token) return c.json({ error: 'Turnstile verification required' }, 400);
  const ip = c.req.header('CF-Connecting-IP') ?? '';
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: c.env.TURNSTILE_SECRET,
        response: token,
        remoteip: ip,
        idempotency_key: crypto.randomUUID(),
      }),
    },
  );
  const result = await response.json<{ success?: boolean }>();
  return result.success
    ? null
    : c.json({ error: 'Turnstile verification failed' }, 400);
}

async function rateLimit(
  c: ApiContext,
  user: SessionUser,
  action: string,
): Promise<Response | null> {
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const result = await c.env.WRITE_RATE_LIMITER.limit({
    key: `${action}:${user.id}:${ip}`,
  });
  return result.success ? null : c.json({ error: 'Too many requests' }, 429);
}

for (const collection of ['teams', 'tier-lists'] as const) {
  app.get(`/v1/${collection}`, (c) => listItems(c, routeKind(collection)));
  app.get(`/v1/${collection}/:id`, (c) =>
    getItem(c, routeKind(collection), c.req.param('id')),
  );
  app.post(`/v1/${collection}`, async (c) => {
    const user = await requireUser(c);
    if (isResponse(user)) return user;
    const limited = await rateLimit(c, user, 'publish');
    if (limited) return limited;
    const challenge = await verifyTurnstile(c);
    if (challenge) return challenge;
    const kind = routeKind(collection);
    const payload = parsePayload(kind, await c.req.json());
    await validateCatalogReferences(c.env, kind, payload);
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const title = payload.name;
    const itemSlug = slugify(title);
    const contentType = payload.content_type;
    const facet = 'faction' in payload ? payload.faction : payload.entity_type;
    const storedPayload = {
      ...payload,
      slug: itemSlug,
      author: user.displayName,
      last_updated: now,
    };
    await c.env.DB.prepare(
      `INSERT INTO community_items
      (id, kind, slug, title, owner_user_id, content_type, facet, payload_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        kind,
        itemSlug,
        title,
        user.id,
        contentType,
        facet,
        JSON.stringify(storedPayload),
        now,
        now,
      )
      .run();
    return c.json({ id, slug: itemSlug }, 201);
  });
  app.patch(`/v1/${collection}/:id`, async (c) => {
    const user = await requireUser(c);
    if (isResponse(user)) return user;
    const limited = await rateLimit(c, user, 'edit');
    if (limited) return limited;
    const kind = routeKind(collection);
    const existing = await c.env.DB.prepare(
      `SELECT i.owner_user_id, i.payload_json, i.revision, u.display_name AS owner_name
         FROM community_items i JOIN users u ON u.id = i.owner_user_id
        WHERE i.id = ? AND i.kind = ? AND i.status != 'deleted'`,
    )
      .bind(c.req.param('id'), kind)
      .first<{
        owner_user_id: string;
        payload_json: string;
        revision: number;
        owner_name: string;
      }>();
    if (!existing) return c.json({ error: 'Not found' }, 404);
    if (existing.owner_user_id !== user.id && user.role !== 'moderator')
      return c.json({ error: 'Forbidden' }, 403);
    const payload = parsePayload(kind, await c.req.json());
    await validateCatalogReferences(c.env, kind, payload);
    const now = Math.floor(Date.now() / 1000);
    const nextRevision = existing.revision + 1;
    const itemSlug = slugify(payload.name);
    const facet = 'faction' in payload ? payload.faction : payload.entity_type;
    const storedPayload = {
      ...payload,
      slug: itemSlug,
      author: existing.owner_name,
      last_updated: now,
    };
    await c.env.DB.batch([
      c.env.DB.prepare(
        'INSERT INTO community_revisions (item_id, revision, editor_user_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?)',
      ).bind(
        c.req.param('id'),
        existing.revision,
        user.id,
        existing.payload_json,
        now,
      ),
      c.env.DB.prepare(
        'UPDATE community_items SET slug = ?, title = ?, content_type = ?, facet = ?, payload_json = ?, revision = ?, updated_at = ? WHERE id = ?',
      ).bind(
        itemSlug,
        payload.name,
        payload.content_type,
        facet,
        JSON.stringify(storedPayload),
        nextRevision,
        now,
        c.req.param('id'),
      ),
    ]);
    return c.json({ ok: true, revision: nextRevision });
  });
  app.delete(`/v1/${collection}/:id`, async (c) => {
    const user = await requireUser(c);
    if (isResponse(user)) return user;
    const existing = await c.env.DB.prepare(
      "SELECT owner_user_id FROM community_items WHERE id = ? AND kind = ? AND status != 'deleted'",
    )
      .bind(c.req.param('id'), routeKind(collection))
      .first<{ owner_user_id: string }>();
    if (!existing) return c.json({ error: 'Not found' }, 404);
    if (existing.owner_user_id !== user.id && user.role !== 'moderator')
      return c.json({ error: 'Forbidden' }, 403);
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.prepare(
      "UPDATE community_items SET status = 'deleted', deleted_at = ?, updated_at = ? WHERE id = ?",
    )
      .bind(now, now, c.req.param('id'))
      .run();
    return c.json({ ok: true });
  });
  app.put(`/v1/${collection}/:id/upvote`, async (c) => {
    const user = await requireUser(c);
    if (isResponse(user)) return user;
    const limited = await rateLimit(c, user, 'vote');
    if (limited) return limited;
    const item = await c.env.DB.prepare(
      "SELECT owner_user_id FROM community_items WHERE id = ? AND kind = ? AND status = 'published'",
    )
      .bind(c.req.param('id'), routeKind(collection))
      .first<{ owner_user_id: string }>();
    if (!item) return c.json({ error: 'Not found' }, 404);
    if (item.owner_user_id === user.id)
      return c.json({ error: 'You cannot upvote your own publication' }, 400);
    const now = Math.floor(Date.now() / 1000);
    const inserted = await c.env.DB.prepare(
      'INSERT OR IGNORE INTO votes (item_id, user_id, created_at) VALUES (?, ?, ?)',
    )
      .bind(c.req.param('id'), user.id, now)
      .run();
    if (inserted.meta.changes)
      await c.env.DB.prepare(
        'UPDATE community_items SET score = score + 1 WHERE id = ?',
      )
        .bind(c.req.param('id'))
        .run();
    const score = await c.env.DB.prepare(
      'SELECT score FROM community_items WHERE id = ?',
    )
      .bind(c.req.param('id'))
      .first<{ score: number }>();
    return c.json({ score: score?.score ?? 0, viewerHasUpvoted: true });
  });
  app.delete(`/v1/${collection}/:id/upvote`, async (c) => {
    const user = await requireUser(c);
    if (isResponse(user)) return user;
    const removed = await c.env.DB.prepare(
      'DELETE FROM votes WHERE item_id = ? AND user_id = ?',
    )
      .bind(c.req.param('id'), user.id)
      .run();
    if (removed.meta.changes)
      await c.env.DB.prepare(
        'UPDATE community_items SET score = MAX(0, score - 1) WHERE id = ?',
      )
        .bind(c.req.param('id'))
        .run();
    const score = await c.env.DB.prepare(
      'SELECT score FROM community_items WHERE id = ?',
    )
      .bind(c.req.param('id'))
      .first<{ score: number }>();
    return c.json({ score: score?.score ?? 0, viewerHasUpvoted: false });
  });
  app.post(`/v1/${collection}/:id/reports`, async (c) => {
    const user = await requireUser(c);
    if (isResponse(user)) return user;
    const limited = await rateLimit(c, user, 'report');
    if (limited) return limited;
    const challenge = await verifyTurnstile(c);
    if (challenge) return challenge;
    const input = z
      .object({
        reason: z.enum(['spam', 'broken', 'abusive', 'other']),
        note: z.string().trim().max(1000).default(''),
      })
      .parse(await c.req.json());
    const item = await c.env.DB.prepare(
      "SELECT owner_user_id FROM community_items WHERE id = ? AND kind = ? AND status = 'published'",
    )
      .bind(c.req.param('id'), routeKind(collection))
      .first<{ owner_user_id: string }>();
    if (!item) return c.json({ error: 'Not found' }, 404);
    if (item.owner_user_id === user.id)
      return c.json({ error: 'You cannot report your own publication' }, 400);
    await c.env.DB.prepare(
      `INSERT INTO reports (id, item_id, reporter_user_id, reason, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(item_id, reporter_user_id) DO UPDATE SET reason = excluded.reason, note = excluded.note, status = 'open', created_at = excluded.created_at`,
    )
      .bind(
        crypto.randomUUID(),
        c.req.param('id'),
        user.id,
        input.reason,
        input.note,
        Math.floor(Date.now() / 1000),
      )
      .run();
    return c.json({ ok: true }, 201);
  });
  app.get(`/v1/${collection}/:id/revisions`, async (c) => {
    const viewer = await getSessionUser(c);
    const includeHidden = viewer?.role === 'moderator';
    const item = await c.env.DB.prepare(
      `SELECT id FROM community_items WHERE id = ? AND kind = ? AND ${includeHidden ? "status != 'deleted'" : "status = 'published'"}`,
    )
      .bind(c.req.param('id'), routeKind(collection))
      .first<{ id: string }>();
    if (!item) return c.json({ error: 'Not found' }, 404);
    const result = await c.env.DB.prepare(
      `SELECT r.revision, r.created_at, u.display_name AS editor_name
       FROM community_revisions r JOIN users u ON u.id = r.editor_user_id
      WHERE r.item_id = ? ORDER BY r.revision DESC`,
    )
      .bind(c.req.param('id'))
      .all<{ revision: number; created_at: number; editor_name: string }>();
    return c.json({
      revisions: result.results.map((row) => ({
        revision: row.revision,
        editorName: row.editor_name,
        createdAt: row.created_at,
      })),
    });
  });
  app.post(`/v1/${collection}/:id/moderate`, async (c) => {
    const user = await requireUser(c);
    if (isResponse(user)) return user;
    if (user.role !== 'moderator') return c.json({ error: 'Forbidden' }, 403);
    const limited = await rateLimit(c, user, 'moderate');
    if (limited) return limited;
    const input = z
      .object({ action: z.enum(['hide', 'restore', 'delete']) })
      .parse(await c.req.json());
    const existing = await c.env.DB.prepare(
      "SELECT id FROM community_items WHERE id = ? AND kind = ? AND status != 'deleted'",
    )
      .bind(c.req.param('id'), routeKind(collection))
      .first<{ id: string }>();
    if (!existing) return c.json({ error: 'Not found' }, 404);
    const status = statusForModerationAction(input.action);
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.prepare(
      "UPDATE community_items SET status = ?, updated_at = ?, deleted_at = CASE WHEN ? = 'deleted' THEN ? ELSE NULL END WHERE id = ?",
    )
      .bind(status, now, status, now, c.req.param('id'))
      .run();
    return c.json({ ok: true });
  });
}

app.get('/v1/me/items', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const result = await c.env.DB.prepare(
    `SELECT i.*, u.display_name, u.avatar_url, 0 AS viewer_voted
    FROM community_items i JOIN users u ON u.id = i.owner_user_id
    WHERE i.owner_user_id = ? AND i.status != 'deleted' ORDER BY i.updated_at DESC`,
  )
    .bind(user.id)
    .all<ItemRow>();
  return c.json({
    items: result.results.map((row) => presentItem(row, user.id)),
  });
});

app.get('/v1/me/reports', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const result = await c.env.DB.prepare(
    `SELECT r.id, r.item_id, r.reason, r.note, r.status, r.resolution_note, r.created_at,
            i.kind, i.title, i.slug, i.status AS item_status
       FROM reports r JOIN community_items i ON i.id = r.item_id
      WHERE r.reporter_user_id = ? ORDER BY r.created_at DESC LIMIT 100`,
  )
    .bind(user.id)
    .all();
  await c.env.DB.prepare('UPDATE users SET reports_seen_at = ? WHERE id = ?')
    .bind(Math.floor(Date.now() / 1000), user.id)
    .run();
  return c.json({ reports: result.results });
});

app.get('/v1/admin/reports', async (c) => {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  if (user.role !== 'moderator') return c.json({ error: 'Forbidden' }, 403);
  const result = await c.env.DB.prepare(
    `SELECT r.*, i.kind, i.title, i.slug, i.status AS item_status, u.display_name AS reporter_name
    FROM reports r JOIN community_items i ON i.id = r.item_id JOIN users u ON u.id = r.reporter_user_id
    ORDER BY CASE WHEN r.status = 'open' THEN 0 ELSE 1 END, r.created_at DESC LIMIT 200`,
  ).all();
  return c.json({ reports: result.results });
});

app.patch('/v1/admin/reports/:id', async (c) => {
  const user = await requireUser(c);
  if (isResponse(user)) return user;
  if (user.role !== 'moderator') return c.json({ error: 'Forbidden' }, 403);
  const input = z
    .object({
      action: z.enum(['dismiss', 'hide', 'restore', 'delete']),
      note: z.string().trim().max(1000).default(''),
    })
    .parse(await c.req.json());
  const report = await c.env.DB.prepare(
    'SELECT item_id FROM reports WHERE id = ?',
  )
    .bind(c.req.param('id'))
    .first<{ item_id: string }>();
  if (!report) return c.json({ error: 'Not found' }, 404);
  const now = Math.floor(Date.now() / 1000);
  const statements = [
    c.env.DB.prepare(
      'UPDATE reports SET status = ?, resolution_note = ?, resolved_by_user_id = ?, resolved_at = ? WHERE id = ?',
    ).bind(
      input.action === 'dismiss' ? 'dismissed' : 'resolved',
      input.note,
      user.id,
      now,
      c.req.param('id'),
    ),
  ];
  const status =
    input.action === 'dismiss' ? null : statusForModerationAction(input.action);
  if (status)
    statements.push(
      c.env.DB.prepare(
        "UPDATE community_items SET status = ?, updated_at = ?, deleted_at = CASE WHEN ? = 'deleted' THEN ? ELSE NULL END WHERE id = ?",
      ).bind(status, now, status, now, report.item_id),
    );
  await c.env.DB.batch(statements);
  return c.json({ ok: true });
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((error, c) => {
  if (error instanceof HTTPException) return error.getResponse();
  if (error instanceof ZodError)
    return c.json({ error: 'Invalid request', details: error.issues }, 400);
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ event: 'request_failed', message }));
  if (
    message.startsWith('Unknown ') ||
    message.startsWith('Catalog unavailable')
  )
    return c.json({ error: message }, 422);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
