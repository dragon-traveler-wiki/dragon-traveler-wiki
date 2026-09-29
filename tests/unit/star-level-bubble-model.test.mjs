import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeCanvasDimensions,
  getBubbleRadius,
  packWithD3,
  resolveOverlaps,
  rotatedBounds,
} from '../../src/features/characters/components/star-level-bubble-model.ts';

function bubble(r) {
  // Only `r` is read by packWithD3/resolveOverlaps; other fields are unused
  // by the geometry math under test.
  return { r };
}

test('getBubbleRadius grows with copies and respects baseSize as a floor', () => {
  assert.equal(getBubbleRadius(1, 18, 8, 0.5), 18 + 8);
  assert.ok(getBubbleRadius(4, 18, 8, 0.5) > getBubbleRadius(1, 18, 8, 0.5));
  // copies below 1 is clamped to 1, not extrapolated below the floor.
  assert.equal(getBubbleRadius(0, 18, 8, 0.5), getBubbleRadius(1, 18, 8, 0.5));
});

test('packWithD3 returns one non-overlapping position per bubble', () => {
  const bubbles = [bubble(10), bubble(20), bubble(5), bubble(15)];
  const positions = packWithD3(bubbles, 2);
  assert.equal(positions.length, bubbles.length);

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dist = Math.hypot(
        positions[j].x - positions[i].x,
        positions[j].y - positions[i].y,
      );
      // d3.pack guarantees no overlap (minus floating point slack).
      assert.ok(dist >= positions[i].r + positions[j].r - 1e-6);
    }
  }
});

test('packWithD3 returns an empty array for no bubbles', () => {
  assert.deepEqual(packWithD3([], 2), []);
});

test('resolveOverlaps pushes overlapping circles apart until they clear the gap', () => {
  const positions = [
    { x: 0, y: 0, r: 10 },
    { x: 5, y: 0, r: 10 },
  ];
  const resolved = resolveOverlaps(positions, 30, 2);
  const dist = Math.hypot(
    resolved[1].x - resolved[0].x,
    resolved[1].y - resolved[0].y,
  );
  assert.ok(dist >= 10 + 10 + 2 - 1e-6);
});

test('resolveOverlaps leaves already-separated circles untouched', () => {
  const positions = [
    { x: 0, y: 0, r: 5 },
    { x: 100, y: 0, r: 5 },
  ];
  const resolved = resolveOverlaps(positions);
  assert.deepEqual(resolved, positions);
});

test('computeCanvasDimensions bounds every circle with padding', () => {
  const { w, h, ox, oy } = computeCanvasDimensions([
    { x: 0, y: 0, r: 10 },
    { x: 50, y: 20, r: 5 },
  ]);
  // minX=-10, maxX=55, minY=-10, maxY=25 -> w = 65+24, h = 35+24
  assert.equal(w, 65 + 24);
  assert.equal(h, 35 + 24);
  assert.equal(ox, 10 + 12);
  assert.equal(oy, 10 + 12);
});

test('rotatedBounds is a no-op at 0 degrees and swaps axes at 90', () => {
  const identity = rotatedBounds(100, 40, 0);
  assert.equal(identity.rw, 100);
  assert.equal(identity.rh, 40);

  // cos(90deg) isn't exactly 0 in floating point, so the ceil'd bound can be
  // one pixel over the ideal swapped value — allow that slack.
  const rotated90 = rotatedBounds(100, 40, 90);
  assert.ok(Math.abs(rotated90.rw - 40) <= 1);
  assert.ok(Math.abs(rotated90.rh - 100) <= 1);
});
