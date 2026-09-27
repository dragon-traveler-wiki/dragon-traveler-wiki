import type { Suspension } from './suspension';

export type Provider = 'github' | 'discord';
export type CommunityKind = 'team' | 'tier_list';

export interface Env {
  DB: D1Database;
  WRITE_RATE_LIMITER: RateLimit;
  APP_ORIGIN: string;
  ALLOWED_ORIGINS: string;
  CATALOG_BASE_URL: string;
  SESSION_TTL_DAYS: string;
  MODERATOR_IDENTITIES: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  TURNSTILE_SECRET: string;
}

export interface SessionUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'user' | 'moderator';
  primaryProvider: Provider | null;
  /** The suspension currently in force, if any. */
  suspension: Suspension | null;
  csrfToken: string;
}

export interface OAuthProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}
