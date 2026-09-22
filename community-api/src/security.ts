import type { Context } from 'hono';
import type { Env, SessionUser } from './types';

const encoder = new TextEncoder();

export function randomToken(bytes = 32): string {
  const value = crypto.getRandomValues(new Uint8Array(bytes));
  return base64Url(value);
}

export function base64Url(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return base64Url(new Uint8Array(digest));
}

export function parseCookies(
  header: string | undefined,
): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').flatMap((part) => {
      const index = part.indexOf('=');
      if (index < 1) return [];
      return [
        [
          part.slice(0, index).trim(),
          decodeURIComponent(part.slice(index + 1)),
        ],
      ];
    }),
  );
}

export function sessionCookie(token: string, maxAge: number): string {
  return `dt_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function oauthStateCookie(state: string, maxAge = 600): string {
  return `dt_oauth_state=${encodeURIComponent(state)}; Path=/v1/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookie(name: string, path = '/'): string {
  return `${name}=; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function getSessionUser(
  c: Context<{ Bindings: Env }>,
): Promise<SessionUser | null> {
  const token = parseCookies(c.req.header('Cookie')).dt_session;
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.display_name, u.avatar_url, u.role, u.primary_provider, s.csrf_token
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ? AND u.deleted_at IS NULL`,
  )
    .bind(tokenHash, now)
    .first<{
      id: string;
      display_name: string;
      avatar_url: string | null;
      role: 'user' | 'moderator';
      primary_provider: 'github' | 'discord' | null;
      csrf_token: string;
    }>();
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    primaryProvider: row.primary_provider,
    csrfToken: row.csrf_token,
  };
}

export async function requireUser(
  c: Context<{ Bindings: Env }>,
): Promise<SessionUser | Response> {
  const user = await getSessionUser(c);
  if (!user) return c.json({ error: 'Authentication required' }, 401);
  const csrf = c.req.header('X-CSRF-Token');
  if (!csrf || csrf !== user.csrfToken)
    return c.json({ error: 'Invalid CSRF token' }, 403);
  return user;
}

export function isResponse(value: SessionUser | Response): value is Response {
  return value instanceof Response;
}
