import type { Context } from 'hono';
import type { Env, OAuthProfile, Provider, SessionUser } from './types';
import {
  clearCookie,
  getSessionUser,
  oauthStateCookie,
  parseCookies,
  randomToken,
  sessionCookie,
  sha256,
} from './security';

type ApiContext = Context<{ Bindings: Env }>;

const OAUTH_STATE_TTL_SECONDS = 10 * 60;

class OAuthLinkConflictError extends Error {}

function callbackUrl(c: ApiContext, provider: Provider): string {
  return `${new URL(c.req.url).origin}/v1/auth/${provider}/callback`;
}

function providerConfig(env: Env, provider: Provider) {
  return provider === 'github'
    ? {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scope: 'read:user',
      }
    : {
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
        authorizationUrl: 'https://discord.com/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        scope: 'identify',
      };
}

export async function startOAuth(
  c: ApiContext,
  provider: Provider,
): Promise<Response> {
  const config = providerConfig(c.env, provider);
  if (!config.clientId || !config.clientSecret)
    return c.json({ error: `${provider} login is not configured` }, 503);

  const mode = c.req.query('mode') === 'link' ? 'link' : 'login';
  const currentUser = mode === 'link' ? await getSessionUser(c) : null;
  if (mode === 'link' && !currentUser)
    return c.json(
      { error: 'Authentication required to link an identity' },
      401,
    );

  const requestedReturnTo = c.req.query('returnTo') ?? '/account';
  const returnTo =
    requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//')
      ? requestedReturnTo
      : '/account';
  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = await sha256(verifier);
  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    `INSERT INTO oauth_states (state_hash, provider, mode, user_id, code_verifier, return_to, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      await sha256(state),
      provider,
      mode,
      currentUser?.id ?? null,
      verifier,
      returnTo,
      now + OAUTH_STATE_TTL_SECONDS,
    )
    .run();

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: callbackUrl(c, provider),
    response_type: 'code',
    scope: config.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  const response = c.redirect(
    `${config.authorizationUrl}?${params.toString()}`,
  );
  response.headers.append('Set-Cookie', oauthStateCookie(state));
  return response;
}

async function exchangeCode(
  c: ApiContext,
  provider: Provider,
  code: string,
  verifier: string,
): Promise<string> {
  const config = providerConfig(c.env, provider);
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: callbackUrl(c, provider),
    code_verifier: verifier,
    grant_type: 'authorization_code',
  });
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const value = await response.json<Record<string, unknown>>();
  const token = value.access_token;
  if (!response.ok || typeof token !== 'string')
    throw new Error(`OAuth token exchange failed for ${provider}`);
  return token;
}

async function loadProfile(
  provider: Provider,
  token: string,
): Promise<OAuthProfile> {
  const url =
    provider === 'github'
      ? 'https://api.github.com/user'
      : 'https://discord.com/api/users/@me';
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'User-Agent': 'dragon-traveler-community-api',
    },
  });
  if (!response.ok)
    throw new Error(`OAuth profile request failed for ${provider}`);
  const value = await response.json<Record<string, unknown>>();
  const id = String(value.id ?? '');
  const username = String(value.login ?? value.username ?? '');
  if (!id || !username)
    throw new Error(`OAuth profile from ${provider} was incomplete`);
  const globalName =
    typeof value.global_name === 'string' ? value.global_name : null;
  const avatarUrl =
    provider === 'github'
      ? typeof value.avatar_url === 'string'
        ? value.avatar_url
        : null
      : typeof value.avatar === 'string'
        ? `https://cdn.discordapp.com/avatars/${id}/${value.avatar}.png`
        : null;
  const displayName =
    provider === 'github' ? username : (globalName ?? username);
  return {
    id,
    username,
    displayName: displayName.slice(0, 50),
    avatarUrl,
  };
}

export function isModerator(
  env: Env,
  provider: Provider,
  providerUserId: string,
): boolean {
  return env.MODERATOR_IDENTITIES.split(',')
    .map((value) => value.trim())
    .includes(`${provider}:${providerUserId}`);
}

async function resolveUser(
  c: ApiContext,
  provider: Provider,
  profile: OAuthProfile,
  mode: 'login' | 'link',
  linkingUserId: string | null,
): Promise<string> {
  const existing = await c.env.DB.prepare(
    `SELECT oi.user_id, u.primary_provider
       FROM oauth_identities oi JOIN users u ON u.id = oi.user_id
      WHERE oi.provider = ? AND oi.provider_user_id = ?`,
  )
    .bind(provider, profile.id)
    .first<{ user_id: string; primary_provider: Provider | null }>();
  const now = Math.floor(Date.now() / 1000);

  if (mode === 'link') {
    if (!linkingUserId) throw new Error('Linking session is no longer valid');
    if (existing && existing.user_id !== linkingUserId)
      throw new OAuthLinkConflictError(
        'This identity is already linked to another account',
      );
    await c.env.DB.prepare(
      `INSERT INTO oauth_identities (provider, provider_user_id, user_id, username, avatar_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(provider, provider_user_id) DO UPDATE SET username = excluded.username, avatar_url = excluded.avatar_url, updated_at = excluded.updated_at`,
    )
      .bind(
        provider,
        profile.id,
        linkingUserId,
        profile.username,
        profile.avatarUrl,
        now,
        now,
      )
      .run();
    return linkingUserId;
  }

  if (existing) {
    const isPrimary = existing.primary_provider === provider;
    const userUpdateSql = isPrimary
      ? "UPDATE users SET display_name = ?, avatar_url = COALESCE(?, avatar_url), updated_at = ?, role = CASE WHEN ? THEN 'moderator' ELSE role END WHERE id = ?"
      : "UPDATE users SET updated_at = ?, role = CASE WHEN ? THEN 'moderator' ELSE role END WHERE id = ?";
    const userUpdateBindings = isPrimary
      ? [
          profile.displayName,
          profile.avatarUrl,
          now,
          isModerator(c.env, provider, profile.id) ? 1 : 0,
          existing.user_id,
        ]
      : [
          now,
          isModerator(c.env, provider, profile.id) ? 1 : 0,
          existing.user_id,
        ];
    await c.env.DB.batch([
      c.env.DB.prepare(
        'UPDATE oauth_identities SET username = ?, avatar_url = ?, updated_at = ? WHERE provider = ? AND provider_user_id = ?',
      ).bind(profile.username, profile.avatarUrl, now, provider, profile.id),
      c.env.DB.prepare(userUpdateSql).bind(...userUpdateBindings),
    ]);
    return existing.user_id;
  }

  const userId = crypto.randomUUID();
  await c.env.DB.batch([
    c.env.DB.prepare(
      'INSERT INTO users (id, display_name, avatar_url, role, primary_provider, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      userId,
      profile.displayName,
      profile.avatarUrl,
      isModerator(c.env, provider, profile.id) ? 'moderator' : 'user',
      provider,
      now,
      now,
    ),
    c.env.DB.prepare(
      'INSERT INTO oauth_identities (provider, provider_user_id, user_id, username, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(
      provider,
      profile.id,
      userId,
      profile.username,
      profile.avatarUrl,
      now,
      now,
    ),
  ]);
  return userId;
}

export async function finishOAuth(
  c: ApiContext,
  provider: Provider,
): Promise<Response> {
  const state = c.req.query('state');
  const code = c.req.query('code');
  const cookieState = parseCookies(c.req.header('Cookie')).dt_oauth_state;
  if (!state || !code || !cookieState || state !== cookieState)
    return c.json({ error: 'Invalid OAuth state' }, 400);

  const now = Math.floor(Date.now() / 1000);
  const stateHash = await sha256(state);
  const row = await c.env.DB.prepare(
    'SELECT provider, mode, user_id, code_verifier, return_to FROM oauth_states WHERE state_hash = ? AND expires_at > ?',
  )
    .bind(stateHash, now)
    .first<{
      provider: Provider;
      mode: 'login' | 'link';
      user_id: string | null;
      code_verifier: string;
      return_to: string;
    }>();
  await c.env.DB.prepare('DELETE FROM oauth_states WHERE state_hash = ?')
    .bind(stateHash)
    .run();
  if (!row || row.provider !== provider)
    return c.json({ error: 'OAuth state expired' }, 400);

  try {
    const accessToken = await exchangeCode(
      c,
      provider,
      code,
      row.code_verifier,
    );
    const profile = await loadProfile(provider, accessToken);
    const userId = await resolveUser(
      c,
      provider,
      profile,
      row.mode,
      row.user_id,
    );
    const sessionToken = randomToken();
    const csrfToken = randomToken(24);
    const ttl =
      Math.max(1, Number.parseInt(c.env.SESSION_TTL_DAYS || '30', 10)) * 86400;
    await c.env.DB.prepare(
      'INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
    )
      .bind(await sha256(sessionToken), userId, csrfToken, now + ttl, now)
      .run();
    const destination = new URL(row.return_to, c.env.APP_ORIGIN);
    destination.searchParams.set(
      'auth',
      row.mode === 'link' ? 'linked' : 'success',
    );
    const response = c.redirect(destination.toString());
    response.headers.append('Set-Cookie', sessionCookie(sessionToken, ttl));
    response.headers.append(
      'Set-Cookie',
      clearCookie('dt_oauth_state', '/v1/auth'),
    );
    return response;
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'oauth_failed',
        provider,
        error: error instanceof Error ? error.message : String(error),
      }),
    );
    const destination = new URL('/account', c.env.APP_ORIGIN);
    destination.searchParams.set('auth', 'error');
    destination.searchParams.set(
      'reason',
      error instanceof OAuthLinkConflictError ? 'link_conflict' : 'unknown',
    );
    return c.redirect(destination.toString());
  }
}

export async function logout(
  c: ApiContext,
  user: SessionUser,
): Promise<Response> {
  const token = parseCookies(c.req.header('Cookie')).dt_session;
  if (token)
    await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(await sha256(token))
      .run();
  const response = c.json({ ok: true, userId: user.id });
  response.headers.append('Set-Cookie', clearCookie('dt_session'));
  return response;
}

export async function deleteAccount(
  c: ApiContext,
  user: SessionUser,
): Promise<Response> {
  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.batch([
    // Reports about content that's going away no longer need a moderator.
    c.env.DB.prepare(
      "UPDATE reports SET status = 'resolved', resolution_note = 'Removed with its author''s account.', resolved_at = ? WHERE status = 'open' AND item_id IN (SELECT id FROM community_items WHERE owner_user_id = ?)",
    ).bind(now, user.id),
    c.env.DB.prepare(
      "UPDATE community_items SET status = 'deleted', deleted_at = ?, updated_at = ? WHERE owner_user_id = ? AND status != 'deleted'",
    ).bind(now, now, user.id),
    c.env.DB.prepare('DELETE FROM oauth_identities WHERE user_id = ?').bind(
      user.id,
    ),
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    c.env.DB.prepare(
      'UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ?',
    ).bind(now, now, user.id),
  ]);
  const response = c.json({ ok: true });
  response.headers.append('Set-Cookie', clearCookie('dt_session'));
  return response;
}
