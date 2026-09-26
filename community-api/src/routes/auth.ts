import { deleteAccount, finishOAuth, logout, startOAuth } from '../auth';
import type { ApiContext, App } from '../helpers';
import { getSessionUser, isResponse, requireUser } from '../security';
import { suspensionMessage } from '../suspension';
import type { Provider, SessionUser } from '../types';

// A suspended account can't be deleted or have identities unlinked, since that
// would free the identity to start over with a clean slate.
function suspendedAccountBlock(c: ApiContext, user: SessionUser) {
  return user.suspension
    ? c.json(
        {
          error: `${suspensionMessage(user.suspension)} Account changes are unavailable while suspended.`,
          code: 'suspended',
          suspension: user.suspension,
        },
        403,
      )
    : null;
}

export function registerAuthRoutes(app: App) {
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
    const openReports =
      user.role === 'moderator'
        ? await c.env.DB.prepare(
            "SELECT COUNT(*) AS count FROM reports WHERE status = 'open'",
          ).first<{ count: number }>()
        : null;
    return c.json({
      user: {
        id: user.id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        openReportCount: openReports?.count ?? 0,
        primaryProvider: user.primaryProvider,
        identities: identities.results,
        unreadReportCount: unread?.count ?? 0,
        suspension: user.suspension,
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
    const blocked = suspendedAccountBlock(c, user);
    if (blocked) return blocked;
    return deleteAccount(c, user);
  });

  for (const provider of ['github', 'discord'] as const) {
    app.delete(`/v1/auth/${provider}/unlink`, async (c) => {
      const user = await requireUser(c);
      if (isResponse(user)) return user;
      const blocked = suspendedAccountBlock(c, user);
      if (blocked) return blocked;
      const identities = await c.env.DB.prepare(
        'SELECT provider FROM oauth_identities WHERE user_id = ?',
      )
        .bind(user.id)
        .all<{ provider: Provider }>();
      if (identities.results.length <= 1)
        return c.json(
          { error: 'Cannot unlink your only linked identity' },
          400,
        );
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
}
