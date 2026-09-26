import { Hono, type Context } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { purgeExpired } from './retention';
import { registerAuthRoutes } from './routes/auth';
import { registerInteractionRoutes } from './routes/interactions';
import { registerItemRoutes } from './routes/items';
import { registerModerationRoutes } from './routes/moderation';
import { registerProfileRoutes } from './routes/profiles';
import { registerSettingsRoutes } from './routes/settings';
import type { Env } from './types';
import { nowSeconds } from './time';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const requestId = crypto.randomUUID();
  c.header('X-Request-ID', requestId);
  c.header('X-Content-Type-Options', 'nosniff');
  const started = Date.now();
  try {
    await next();
  } finally {
    console.log(
      JSON.stringify({
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - started,
      }),
    );
  }
});

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const env = (c as Context<{ Bindings: Env }>).env;
      const allowed = env.ALLOWED_ORIGINS.split(',').map((value) =>
        value.trim(),
      );
      return allowed.includes(origin) ? origin : env.APP_ORIGIN;
    },
    allowHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Turnstile-Token'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 86400,
  }),
);

app.get('/v1/health', (c) => c.json({ ok: true }));

registerAuthRoutes(app);
registerProfileRoutes(app);
registerItemRoutes(app);
registerInteractionRoutes(app);
registerModerationRoutes(app);
registerSettingsRoutes(app);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((error, c) => {
  if (error instanceof HTTPException) return error.getResponse();
  if (error instanceof ZodError)
    return c.json({ error: 'Invalid request', details: error.issues }, 400);
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ event: 'request_failed', message }));
  if (
    message.startsWith('Unknown ') ||
    message.startsWith('Catalog unavailable')
  )
    return c.json({ error: message }, 422);
  return c.json({ error: 'Internal server error' }, 500);
});

export default {
  fetch: app.fetch,
  // Daily housekeeping (see the cron trigger in wrangler.jsonc).
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(purgeExpired(env.DB, nowSeconds()));
  },
} satisfies ExportedHandler<Env>;
