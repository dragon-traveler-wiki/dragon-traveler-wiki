import { z } from 'zod';
import { logAction, rateLimit } from '../helpers';
import type { App } from '../helpers';
import { isResponse, requireUser } from '../security';

const REFERENCE_TIER_LIST_KEY = 'reference_tier_list_id';

export function registerSettingsRoutes(app: App) {
  // The moderator-pinned character tier list used as the default "Tier List
  // Reference". Returns null if nothing is pinned or the pinned list is no
  // longer published, so a deleted or hidden list never lingers as the default.
  app.get('/v1/settings', async (c) => {
    const row = await c.env.DB.prepare(
      `SELECT i.id FROM site_settings s
       JOIN community_items i ON i.id = s.value
      WHERE s.key = ? AND i.kind = 'tier_list' AND i.status = 'published'`,
    )
      .bind(REFERENCE_TIER_LIST_KEY)
      .first<{ id: string }>();
    return c.json({ referenceTierListId: row?.id ?? null });
  });

  app.put('/v1/admin/settings/reference-tier-list', async (c) => {
    const user = await requireUser(c);
    if (isResponse(user)) return user;
    if (user.role !== 'moderator') return c.json({ error: 'Forbidden' }, 403);
    const limited = await rateLimit(c, user, 'moderate');
    if (limited) return limited;
    const input = z
      .object({ id: z.string().min(1).max(64).nullable() })
      .parse(await c.req.json());
    if (input.id === null) {
      await c.env.DB.batch([
        c.env.DB.prepare('DELETE FROM site_settings WHERE key = ?').bind(
          REFERENCE_TIER_LIST_KEY,
        ),
        logAction(
          c.env.DB,
          user.id,
          'clear-reference',
          'setting',
          REFERENCE_TIER_LIST_KEY,
          '',
          Math.floor(Date.now() / 1000),
        ),
      ]);
      return c.json({ ok: true });
    }
    const item = await c.env.DB.prepare(
      "SELECT id FROM community_items WHERE id = ? AND kind = 'tier_list' AND facet = 'character' AND status = 'published'",
    )
      .bind(input.id)
      .first<{ id: string }>();
    if (!item)
      return c.json(
        { error: 'Only a published character tier list can be the reference' },
        400,
      );
    const now = Math.floor(Date.now() / 1000);
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO site_settings (key, value, updated_at, updated_by_user_id) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at,
       updated_by_user_id = excluded.updated_by_user_id`,
      ).bind(REFERENCE_TIER_LIST_KEY, input.id, now, user.id),
      logAction(
        c.env.DB,
        user.id,
        'set-reference',
        'setting',
        REFERENCE_TIER_LIST_KEY,
        input.id,
        now,
      ),
    ]);
    return c.json({ ok: true });
  });
}
