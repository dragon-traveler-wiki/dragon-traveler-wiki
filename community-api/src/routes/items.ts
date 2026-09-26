import {
  COLLECTIONS,
  decodeCursor,
  encodeCursor,
  presentItem,
  rateLimit,
  resolveOpenReports,
  routeKind,
  verifyTurnstile,
} from '../helpers';
import type { ApiContext, App, ItemRow } from '../helpers';
import {
  getSessionUser,
  isResponse,
  requireActiveUser,
  requireUser,
} from '../security';
import type { CommunityKind } from '../types';
import {
  parsePayload,
  slugify,
  validateCatalogReferences,
} from '../validation';

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

export function registerItemRoutes(app: App) {
  for (const collection of COLLECTIONS) {
    app.get(`/v1/${collection}`, (c) => listItems(c, routeKind(collection)));
    app.get(`/v1/${collection}/:id`, (c) =>
      getItem(c, routeKind(collection), c.req.param('id')),
    );
    app.post(`/v1/${collection}`, async (c) => {
      const user = await requireActiveUser(c);
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
      const facet =
        'faction' in payload ? payload.faction : payload.entity_type;
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
      const user = await requireActiveUser(c);
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
      const facet =
        'faction' in payload ? payload.faction : payload.entity_type;
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
      await c.env.DB.batch([
        c.env.DB.prepare(
          "UPDATE community_items SET status = 'deleted', deleted_at = ?, updated_at = ? WHERE id = ?",
        ).bind(now, now, c.req.param('id')),
        resolveOpenReports(
          c.env.DB,
          c.req.param('id'),
          existing.owner_user_id === user.id
            ? 'Removed by its author.'
            : 'Removed by a moderator.',
          existing.owner_user_id === user.id ? null : user.id,
          now,
        ),
      ]);
      return c.json({ ok: true });
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
  }
}
