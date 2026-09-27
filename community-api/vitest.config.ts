import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The route tests boot a local D1 through wrangler, which takes a moment.
    testTimeout: 30_000,
    hookTimeout: 90_000,
    pool: 'forks',
  },
});
