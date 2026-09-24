import assert from 'node:assert/strict';
import test from 'node:test';
import { retryFailedDataSources } from '../../src/utils/retry-failed-data-sources.ts';

test('composite retries invoke only failed data sources', () => {
  const retried = [];

  retryFailedDataSources(
    [new Error('characters failed'), () => retried.push('characters')],
    [null, () => retried.push('gear')],
    [new Error('gear sets failed'), () => retried.push('gear sets')],
    [undefined, () => retried.push('status effects')],
  );

  assert.deepEqual(retried, ['characters', 'gear sets']);
});
