import { z } from 'zod';
import { COLLECTIONS, rateLimit, routeKind, verifyTurnstile } from '../helpers';
import type { App } from '../helpers';
import { isResponse, requireActiveUser, requireUser } from '../security';

export function registerInteractionRoutes(app: App) {
  for (const collection of COLLECTIONS) {
    app.put(`/v1/${collection}/:id/upvote`, async (c) => {
      const user = await requireActiveUser(c);
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
      const user = await requireActiveUser(c);
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
  }
}
