import { Hono } from 'hono';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { CommunityKind, Env, SessionUser } from './types';

/** Types and helpers shared by the route modules. */
/** The two content collections served under /v1 (teams and tier lists). */
export const COLLECTIONS = ['teams', 'tier-lists'] as const;

export type App = Hono<{ Bindings: Env }>;

export type ApiContext = Context<{ Bindings: Env }>;

export type ActionTarget = 'team' | 'tier_list' | 'user' | 'report' | 'setting';

/** Audit-log row for a moderator action; include it in the action's own batch. */
export function logAction(
  db: D1Database,
  moderatorId: string,
  action: string,
  targetKind: ActionTarget,
  targetId: string,
  note: string,
  now: number,
) {
  return db
    .prepare(
      'INSERT INTO moderation_actions (id, moderator_user_id, action, target_kind, target_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      crypto.randomUUID(),
      moderatorId,
      action,
      targetKind,
      targetId,
      note,
      now,
    );
}

/** Closes every open report on an item once the item itself has been dealt with. */
export function resolveOpenReports(
  db: D1Database,
  itemId: string,
  note: string,
  resolvedBy: string | null,
  now: number,
) {
  return db
    .prepare(
      "UPDATE reports SET status = 'resolved', resolution_note = ?, resolved_by_user_id = ?, resolved_at = ? WHERE item_id = ? AND status = 'open'",
    )
    .bind(note, resolvedBy, now, itemId);
}

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

export interface ItemRow {
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

export function presentItem(row: ItemRow, viewerId: string | null) {
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

export async function verifyTurnstile(c: ApiContext): Promise<Response | null> {
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

export async function rateLimit(
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
