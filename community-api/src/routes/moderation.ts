import { z } from 'zod';
import { isModerator } from '../auth';
import {
  COLLECTIONS,
  logAction,
  rateLimit,
  resolveOpenReports,
  routeKind,
} from '../helpers';
import type { App } from '../helpers';
import { statusForModerationAction } from '../moderation';
import { getSessionUser, isResponse, requireUser } from '../security';
import { SUSPENSION_DURATIONS, suspensionEnd } from '../suspension';
import type { CommunityKind, Provider } from '../types';

const SuspendInput = z.object({
  duration: z.enum(SUSPENSION_DURATIONS),
  reason: z.string().trim().max(500).default(''),
  hideContent: z.boolean().default(false),
});

const RoleInput = z.object({ role: z.enum(['user', 'moderator']) });

export function registerModerationRoutes(app: App) {
  app.get('/v1/admin/reports', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Authentication required' }, 401);
    if (user.role !== 'moderator') return c.json({ error: 'Forbidden' }, 403);
    const result = await c.env.DB.prepare(
      `SELECT r.*, i.kind, i.title, i.slug, i.status AS item_status, u.display_name AS reporter_name,
            i.owner_user_id AS author_id, a.display_name AS author_name
    FROM reports r JOIN community_items i ON i.id = r.item_id JOIN users u ON u.id = r.reporter_user_id
    JOIN users a ON a.id = i.owner_user_id
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
      `SELECT r.item_id, r.status, i.kind FROM reports r
       JOIN community_items i ON i.id = r.item_id WHERE r.id = ?`,
    )
      .bind(c.req.param('id'))
      .first<{ item_id: string; status: string; kind: CommunityKind }>();
    if (!report) return c.json({ error: 'Not found' }, 404);
    if (report.status !== 'open')
      return c.json({ error: 'This report has already been resolved' }, 409);
    const now = Math.floor(Date.now() / 1000);
    // Hiding, restoring, or deleting acts on the item, so every open report on it
    // is resolved together; a dismissal only settles the one report.
    const statements = [
      input.action === 'dismiss'
        ? c.env.DB.prepare(
            "UPDATE reports SET status = 'dismissed', resolution_note = ?, resolved_by_user_id = ?, resolved_at = ? WHERE id = ?",
          ).bind(input.note, user.id, now, c.req.param('id'))
        : c.env.DB.prepare(
            "UPDATE reports SET status = 'resolved', resolution_note = ?, resolved_by_user_id = ?, resolved_at = ? WHERE item_id = ? AND status = 'open'",
          ).bind(input.note, user.id, now, report.item_id),
    ];
    statements.push(
      input.action === 'dismiss'
        ? logAction(
            c.env.DB,
            user.id,
            'dismiss-report',
            'report',
            c.req.param('id'),
            input.note,
            now,
          )
        : logAction(
            c.env.DB,
            user.id,
            input.action,
            report.kind,
            report.item_id,
            input.note,
            now,
          ),
    );
    const status =
      input.action === 'dismiss'
        ? null
        : statusForModerationAction(input.action);
    if (status)
      statements.push(
        c.env.DB.prepare(
          // Never touch an already-deleted item: hide/restore would resurrect it.
          "UPDATE community_items SET status = ?, updated_at = ?, deleted_at = CASE WHEN ? = 'deleted' THEN ? ELSE NULL END WHERE id = ? AND status != 'deleted'",
        ).bind(status, now, status, now, report.item_id),
      );
    await c.env.DB.batch(statements);
    return c.json({ ok: true });
  });

  app.post('/v1/admin/users/:id/suspend', async (c) => {
    const moderator = await requireUser(c);
    if (isResponse(moderator)) return moderator;
    if (moderator.role !== 'moderator')
      return c.json({ error: 'Forbidden' }, 403);
    const limited = await rateLimit(c, moderator, 'moderate');
    if (limited) return limited;
    const input = SuspendInput.parse(await c.req.json());
    const targetId = c.req.param('id');
    if (targetId === moderator.id)
      return c.json({ error: 'You cannot suspend yourself' }, 400);
    const target = await c.env.DB.prepare(
      'SELECT role FROM users WHERE id = ? AND deleted_at IS NULL',
    )
      .bind(targetId)
      .first<{ role: 'user' | 'moderator' }>();
    if (!target) return c.json({ error: 'Not found' }, 404);
    if (target.role === 'moderator')
      return c.json({ error: 'Moderators cannot be suspended' }, 400);
    const now = Math.floor(Date.now() / 1000);
    const until = suspensionEnd(input.duration, now);
    const published = input.hideContent
      ? await c.env.DB.prepare(
          "SELECT COUNT(*) AS count FROM community_items WHERE owner_user_id = ? AND status = 'published'",
        )
          .bind(targetId)
          .first<{ count: number }>()
      : null;
    const statements = [
      c.env.DB.prepare(
        'UPDATE users SET suspended_until = ?, suspension_permanent = ?, suspension_reason = ?, updated_at = ? WHERE id = ?',
      ).bind(
        until,
        input.duration === 'permanent' ? 1 : 0,
        input.reason,
        now,
        targetId,
      ),
      logAction(
        c.env.DB,
        moderator.id,
        `suspend-${input.duration}`,
        'user',
        targetId,
        input.reason,
        now,
      ),
    ];
    if (input.hideContent) {
      statements.push(
        c.env.DB.prepare(
          "UPDATE community_items SET status = 'hidden', updated_at = ? WHERE owner_user_id = ? AND status = 'published'",
        ).bind(now, targetId),
        logAction(
          c.env.DB,
          moderator.id,
          'hide-content',
          'user',
          targetId,
          `${published?.count ?? 0} published item(s) hidden`,
          now,
        ),
      );
    }
    await c.env.DB.batch(statements);
    return c.json({ ok: true });
  });

  // Moderators are managed in-app; MODERATOR_IDENTITIES only bootstraps the first
  // ones (and can't be demoted here). The role is read on every request, so a
  // promotion or demotion takes effect immediately.
  app.post('/v1/admin/users/:id/role', async (c) => {
    const moderator = await requireUser(c);
    if (isResponse(moderator)) return moderator;
    if (moderator.role !== 'moderator')
      return c.json({ error: 'Forbidden' }, 403);
    const limited = await rateLimit(c, moderator, 'moderate');
    if (limited) return limited;
    const input = RoleInput.parse(await c.req.json());
    const targetId = c.req.param('id');
    if (targetId === moderator.id)
      return c.json({ error: 'You cannot change your own role' }, 400);
    const target = await c.env.DB.prepare(
      'SELECT role FROM users WHERE id = ? AND deleted_at IS NULL',
    )
      .bind(targetId)
      .first<{ role: 'user' | 'moderator' }>();
    if (!target) return c.json({ error: 'Not found' }, 404);
    if (target.role === input.role) return c.json({ ok: true });
    if (input.role === 'user') {
      const identities = await c.env.DB.prepare(
        'SELECT provider, provider_user_id FROM oauth_identities WHERE user_id = ?',
      )
        .bind(targetId)
        .all<{ provider: Provider; provider_user_id: string }>();
      if (
        identities.results.some((identity) =>
          isModerator(c.env, identity.provider, identity.provider_user_id),
        )
      )
        return c.json(
          {
            error:
              'This person is listed in MODERATOR_IDENTITIES; remove them from that setting to demote them.',
          },
          400,
        );
    }
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.batch([
      c.env.DB.prepare(
        'UPDATE users SET role = ?, updated_at = ? WHERE id = ?',
      ).bind(input.role, now, targetId),
      logAction(
        c.env.DB,
        moderator.id,
        input.role === 'moderator' ? 'promote' : 'demote',
        'user',
        targetId,
        '',
        now,
      ),
    ]);
    return c.json({ ok: true });
  });

  app.post('/v1/admin/users/:id/unsuspend', async (c) => {
    const moderator = await requireUser(c);
    if (isResponse(moderator)) return moderator;
    if (moderator.role !== 'moderator')
      return c.json({ error: 'Forbidden' }, 403);
    const limited = await rateLimit(c, moderator, 'moderate');
    if (limited) return limited;
    const targetId = c.req.param('id');
    const target = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL',
    )
      .bind(targetId)
      .first<{ id: string }>();
    if (!target) return c.json({ error: 'Not found' }, 404);
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.batch([
      c.env.DB.prepare(
        "UPDATE users SET suspended_until = NULL, suspension_permanent = 0, suspension_reason = '', updated_at = ? WHERE id = ?",
      ).bind(now, targetId),
      logAction(c.env.DB, moderator.id, 'unsuspend', 'user', targetId, '', now),
    ]);
    return c.json({ ok: true });
  });

  app.get('/v1/admin/actions', async (c) => {
    const user = await getSessionUser(c);
    if (!user) return c.json({ error: 'Authentication required' }, 401);
    if (user.role !== 'moderator') return c.json({ error: 'Forbidden' }, 403);
    // With ?user=<id>, only actions against that user or against items they own.
    const subject = c.req.query('user');
    const result = await c.env.DB.prepare(
      `SELECT a.id, a.action, a.target_kind, a.target_id, a.note, a.created_at,
            m.display_name AS moderator_name,
            COALESCE(i.title, t.display_name) AS target_label
       FROM moderation_actions a
       JOIN users m ON m.id = a.moderator_user_id
       LEFT JOIN community_items i ON a.target_kind IN ('team', 'tier_list') AND i.id = a.target_id
       LEFT JOIN users t ON a.target_kind = 'user' AND t.id = a.target_id
      WHERE ?1 IS NULL
         OR (a.target_kind = 'user' AND a.target_id = ?1)
         OR (a.target_kind IN ('team', 'tier_list') AND i.owner_user_id = ?1)
      ORDER BY a.created_at DESC LIMIT 200`,
    )
      .bind(subject ?? null)
      .all();
    return c.json({ actions: result.results });
  });

  for (const collection of COLLECTIONS) {
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
      await c.env.DB.batch([
        c.env.DB.prepare(
          "UPDATE community_items SET status = ?, updated_at = ?, deleted_at = CASE WHEN ? = 'deleted' THEN ? ELSE NULL END WHERE id = ?",
        ).bind(status, now, status, now, c.req.param('id')),
        resolveOpenReports(
          c.env.DB,
          c.req.param('id'),
          'Handled by a moderator.',
          user.id,
          now,
        ),
        logAction(
          c.env.DB,
          user.id,
          input.action,
          routeKind(collection),
          c.req.param('id'),
          '',
          now,
        ),
      ]);
      return c.json({ ok: true });
    });
  }
}
