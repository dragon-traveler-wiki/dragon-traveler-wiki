import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPlatformProxy } from 'wrangler';
import { vi } from 'vitest';
import worker from '../../src/index';
import { randomToken, sha256 } from '../../src/security';
import type { Env, Provider } from '../../src/types';

const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Statements in a migration file (D1's exec() wants one per line, so split ourselves). */
function migrationStatements(sql: string): string[] {
  return sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

const CATALOG: Record<string, unknown[]> = {
  'enUS/characters.json': [
    { slug: 'athena_ssr_ex', quality: 'SSR EX' },
    { slug: 'zeus_ssr_ex', quality: 'SSR EX' },
  ],
  'enUS/factions.json': [{ slug: 'wild_spirit' }, { slug: 'arcane_wisdom' }],
  'enUS/wyrmspells.json': [],
  'enUS/noble-phantasm.json': [{ slug: 'dwarven_axe' }],
};

export interface TestUser {
  id: string;
  cookie: string;
  csrf: string;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  user?: TestUser;
  /** Send the session cookie without its CSRF header. */
  omitCsrf?: boolean;
  /** A raw request body (sent as JSON) instead of a serialized `body`. */
  rawBody?: string;
  /** Extra headers, e.g. a hand-written Cookie. */
  headers?: Record<string, string>;
}

export interface Harness {
  db: D1Database;
  env: Env;
  request: (path: string, options?: RequestOptions) => Promise<Response>;
  createUser: (options?: {
    id?: string;
    name?: string;
    role?: 'user' | 'moderator';
    identity?: { provider: Provider; providerUserId: string };
  }) => Promise<TestUser>;
  createItem: (options: {
    id: string;
    kind?: 'team' | 'tier_list';
    ownerId: string;
    title?: string;
    status?: 'published' | 'hidden' | 'deleted';
    score?: number;
    createdAt?: number;
  }) => Promise<void>;
  dispose: () => Promise<void>;
}

/**
 * Boots the Worker's real request handler against a throwaway local D1 (via
 * wrangler's platform proxy) with every migration applied. Turnstile and the
 * game catalog are answered by a stubbed `fetch`, so tests never hit the network.
 */
export async function createHarness(): Promise<Harness> {
  const dir = mkdtempSync(join(tmpdir(), 'dt-community-test-'));
  const proxy = await getPlatformProxy<Env>({
    configPath: join(apiDir, 'wrangler.jsonc'),
    persist: { path: join(dir, 'state') },
  });
  const env: Env = {
    ...proxy.env,
    APP_ORIGIN: 'https://app.test',
    ALLOWED_ORIGINS: 'https://app.test',
    CATALOG_BASE_URL: 'https://catalog.test/data',
    SESSION_TTL_DAYS: '30',
    MODERATOR_IDENTITIES: 'github:9001',
    TURNSTILE_SECRET: 'test-secret',
    GITHUB_CLIENT_ID: 'gh-id',
    GITHUB_CLIENT_SECRET: 'gh-secret',
    DISCORD_CLIENT_ID: 'dc-id',
    DISCORD_CLIENT_SECRET: 'dc-secret',
  };

  const migrationsDir = join(apiDir, 'migrations');
  for (const file of readdirSync(migrationsDir).sort()) {
    for (const statement of migrationStatements(
      readFileSync(join(migrationsDir, file), 'utf8'),
    )) {
      await env.DB.prepare(statement).run();
    }
  }

  const realFetch = globalThis.fetch;
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.startsWith('https://challenges.cloudflare.com')) {
      return Response.json({ success: true });
    }
    if (url.startsWith('https://catalog.test/data/')) {
      const entries = CATALOG[url.slice('https://catalog.test/data/'.length)];
      return entries
        ? Response.json(entries)
        : new Response('missing', { status: 404 });
    }
    return realFetch(input, init);
  });

  const ctx = {
    waitUntil() {},
    passThroughOnException() {},
  } as unknown as ExecutionContext;
  let userCounter = 0;
  const now = () => Math.floor(Date.now() / 1000);

  return {
    db: env.DB,
    env,
    async request(
      path,
      { method = 'GET', body, user, omitCsrf, rawBody, headers: extra } = {},
    ) {
      const headers: Record<string, string> = {};
      if (user) {
        headers.Cookie = user.cookie;
        if (!omitCsrf) headers['X-CSRF-Token'] = user.csrf;
      }
      if (body !== undefined || rawBody !== undefined)
        headers['Content-Type'] = 'application/json';
      Object.assign(headers, extra);
      if (method !== 'GET') headers['X-Turnstile-Token'] = 'test-token';
      return worker.fetch(
        new Request(`https://api.test${path}`, {
          method,
          headers,
          body:
            rawBody ?? (body === undefined ? undefined : JSON.stringify(body)),
        }),
        env,
        ctx,
      );
    },
    async createUser({ id, name, role = 'user', identity } = {}) {
      userCounter += 1;
      const userId = id ?? `user-${userCounter}`;
      const token = randomToken();
      const csrf = randomToken(16);
      const timestamp = now();
      await env.DB.batch([
        env.DB.prepare(
          'INSERT INTO users (id, display_name, avatar_url, role, primary_provider, created_at, updated_at) VALUES (?, ?, NULL, ?, ?, ?, ?)',
        ).bind(
          userId,
          name ?? `User ${userCounter}`,
          role,
          identity?.provider ?? null,
          timestamp,
          timestamp,
        ),
        env.DB.prepare(
          'INSERT INTO sessions (token_hash, user_id, csrf_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
        ).bind(await sha256(token), userId, csrf, timestamp + 86400, timestamp),
      ]);
      if (identity) {
        await env.DB.prepare(
          'INSERT INTO oauth_identities (provider, provider_user_id, user_id, username, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, ?, ?)',
        )
          .bind(
            identity.provider,
            identity.providerUserId,
            userId,
            name ?? userId,
            timestamp,
            timestamp,
          )
          .run();
      }
      return {
        id: userId,
        cookie: `dt_session=${encodeURIComponent(token)}`,
        csrf,
      };
    },
    async createItem({
      id,
      kind = 'team',
      ownerId,
      title = id,
      status = 'published',
      score = 0,
      createdAt = now(),
    }) {
      const facet = kind === 'team' ? 'wild_spirit' : 'character';
      await env.DB.prepare(
        `INSERT INTO community_items
           (id, kind, slug, title, owner_user_id, content_type, facet, payload_json, status, score, revision, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'All', ?, ?, ?, ?, 1, ?, ?)`,
      )
        .bind(
          id,
          kind,
          id,
          title,
          ownerId,
          facet,
          JSON.stringify({ name: title }),
          status,
          score,
          createdAt,
          createdAt,
        )
        .run();
    },
    async dispose() {
      vi.restoreAllMocks();
      await proxy.dispose();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export async function json<T = Record<string, unknown>>(
  response: Response,
): Promise<T> {
  return (await response.json()) as T;
}
