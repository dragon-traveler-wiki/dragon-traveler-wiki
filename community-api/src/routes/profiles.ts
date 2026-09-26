import { isModerator } from '../auth';
import { presentItem } from '../helpers';
import type { App, ItemRow } from '../helpers';
import { getSessionUser, isResponse, requireUser } from '../security';
import { activeSuspension } from '../suspension';
import type { Provider } from '../types';
import { nowSeconds } from '../time';

export function registerProfileRoutes(app: App) {
  app.get('/v1/users/:id', async (c) => {
    const row = await c.env.DB.prepare(
      `SELECT id, display_name, avatar_url, role, suspended_until, suspension_permanent,
            suspension_reason FROM users WHERE id = ? AND deleted_at IS NULL`,
    )
      .bind(c.req.param('id'))
      .first<{
        id: string;
        display_name: string;
        avatar_url: string | null;
        role: 'user' | 'moderator';
        suspended_until: number | null;
        suspension_permanent: number;
        suspension_reason: string;
      }>();
    if (!row) return c.json({ error: 'Not found' }, 404);
    const viewer = await getSessionUser(c);
    // Suspension details are only visible to moderators.
    let moderation:
      | {
          canSuspend: boolean;
          suspension: ReturnType<typeof activeSuspension>;
          role: 'user' | 'moderator';
          canChangeRole: boolean;
        }
      | undefined;
    if (viewer?.role === 'moderator') {
      const identities = await c.env.DB.prepare(
        'SELECT provider, provider_user_id FROM oauth_identities WHERE user_id = ?',
      )
        .bind(row.id)
        .all<{ provider: Provider; provider_user_id: string }>();
      moderation = {
        canSuspend: row.role !== 'moderator' && row.id !== viewer.id,
        suspension: activeSuspension(row, nowSeconds()),
        role: row.role,
        // People named in MODERATOR_IDENTITIES are re-granted at every sign-in, so
        // demoting them here would silently undo itself.
        canChangeRole:
          row.id !== viewer.id &&
          !identities.results.some((identity) =>
            isModerator(c.env, identity.provider, identity.provider_user_id),
          ),
      };
    }
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
        moderation,
      },
    });
  });

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
      .bind(nowSeconds(), user.id)
      .run();
    return c.json({ reports: result.results });
  });

  // Lets a reporter withdraw a report that no moderator has handled yet.
  app.delete('/v1/me/reports/:id', async (c) => {
    const user = await requireUser(c);
    if (isResponse(user)) return user;
    const report = await c.env.DB.prepare(
      'SELECT status FROM reports WHERE id = ? AND reporter_user_id = ?',
    )
      .bind(c.req.param('id'), user.id)
      .first<{ status: string }>();
    if (!report) return c.json({ error: 'Not found' }, 404);
    if (report.status !== 'open')
      return c.json({ error: 'Only open reports can be withdrawn' }, 409);
    await c.env.DB.prepare('DELETE FROM reports WHERE id = ?')
      .bind(c.req.param('id'))
      .run();
    return c.json({ ok: true });
  });
}
