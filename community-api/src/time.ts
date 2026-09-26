/** Current time as unix seconds (one place to fake in tests). */
export const nowSeconds = (): number => Math.floor(Date.now() / 1000);
