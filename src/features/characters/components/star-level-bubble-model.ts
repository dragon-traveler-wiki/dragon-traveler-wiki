import type { Character } from '@/features/characters/types';
import type { StarLevel, StarTier } from '@/features/wiki/star-levels/types';
import * as d3 from 'd3-hierarchy';

// ── Tier glow colors & order ─────────────────────────────────────────────────

export const TIER_ORDER: Record<StarTier, number> = {
  base: 0,
  purple: 1,
  red: 2,
  legendary: 3,
  divine: 4,
};

// Rendered on an HTML5 canvas, not through CSS, so these can't reference
// Mantine/--dt-* tokens. Intentionally static across light/dark — the glow
// is decorative and reads fine on both canvas backgrounds.
export const TIER_GLOW: Record<StarTier, string> = {
  base: '#9e9e9e',
  purple: '#ce93d8',
  red: '#ef9a9a',
  legendary: '#ffcc02',
  divine: '#80deea',
};

// ── Chart config ─────────────────────────────────────────────────────────────

export interface ChartConfig {
  // Layout
  /** Minimum bubble radius (px) regardless of copies. */
  baseSize: number;
  /** Multiplier applied to copies^exponent to scale radius. */
  scale: number;
  /** Exponent for copies scaling. 0.5 = sqrt (default), 1 = linear, <0.5 = flat. */
  sizeExponent: number;
  /** Padding between bubbles (d3 pack padding). */
  padding: number;
  // Shape
  /** Lerps between small-first (0) and large-first (1) d3 ordering to push large bubbles outward. */
  centerBias: number;
  /** Horizontal stretch multiplier applied from centre. 1 = no change. */
  stretchX: number;
  /** Vertical stretch multiplier applied from centre. 1 = no change. */
  stretchY: number;
  /** Rotation of the entire layout in degrees. */
  rotation: number;
  // Style
  /** Opacity multiplier for the tier glow box-shadow. 0 = none, 1 = full. */
  glowIntensity: number;
  /** Blur spread of the tier glow in px. */
  glowRadius: number;
  /** Quality border width in px. */
  borderThickness: number;
  /** How much lower tiers fade out. 0 = all same opacity, 1 = base tier nearly invisible. */
  tierFade: number;
}

export const DEFAULT_CONFIG: ChartConfig = {
  baseSize: 18,
  scale: 8,
  sizeExponent: 0.5,
  padding: 3,
  centerBias: 0,
  stretchX: 1,
  stretchY: 1,
  rotation: 0,
  glowIntensity: 1,
  glowRadius: 10,
  borderThickness: 3,
  tierFade: 0,
};

// ── Bubble radius ────────────────────────────────────────────────────────────

export function getBubbleRadius(
  copies: number,
  baseSize: number,
  scale: number,
  exponent: number,
): number {
  return Math.round(baseSize + Math.pow(Math.max(copies, 1), exponent) * scale);
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface BubbleItem {
  identityKey: string;
  char: Character;
  starLevel: StarLevel;
  displayName: string;
  /** Desired radius, used as d3 pack value (r² ∝ area ∝ copies). */
  r: number;
  portrait: string | undefined;
  tierColor: string;
  qualityBorder: string;
}

export interface BubblePosition {
  x: number;
  y: number;
  r: number;
}

// ── D3 circle packing ────────────────────────────────────────────────────────

export const PACK_SIZE = 900;

/**
 * Packs bubbles with d3, sorting by size in the specified direction.
 * Returns positions indexed to match the original `bubbles` array order.
 *
 * Stretch is baked in: radii are divided by `max(sx, sy)` before packing so
 * that after scaling positions by `(sx, sy)` circles touch along the major
 * axis. Minor-axis overlaps from the approximation are resolved separately.
 */
export function packWithD3(
  bubbles: BubbleItem[],
  padding: number,
  largeOutside = false,
  sx = 1,
  sy = 1,
): BubblePosition[] {
  if (bubbles.length === 0) return [];

  const order = bubbles
    .map((_, i) => i)
    .sort((a, b) =>
      largeOutside ? bubbles[a].r - bubbles[b].r : bubbles[b].r - bubbles[a].r,
    );
  const sorted = order.map((i) => bubbles[i]);

  const rFactor = Math.max(sx, sy, 1);

  type Root = { children?: BubbleItem[] };
  const root = d3.hierarchy<Root>({ children: sorted }).sum((d) => {
    const item = d as unknown as BubbleItem;
    if (item.r == null) return 0;
    const rp = item.r / rFactor;
    return rp * rp;
  });

  const packed = d3.pack<Root>().size([PACK_SIZE, PACK_SIZE]).padding(padding)(
    root,
  );

  const cx = PACK_SIZE / 2;
  const cy = PACK_SIZE / 2;

  const result = new Array<BubblePosition>(bubbles.length);
  packed.leaves().forEach((leaf, si) => {
    result[order[si]] = {
      x: cx + (leaf.x - cx) * sx,
      y: cy + (leaf.y - cy) * sy,
      r: leaf.r * rFactor,
    };
  });
  return result;
}

/**
 * Iteratively pushes apart any overlapping circles until they no longer
 * intersect (or `iterations` is exhausted). O(n²) per pass — fine for <200 circles.
 */
export function resolveOverlaps(
  positions: BubblePosition[],
  iterations = 30,
  gap = 2,
): BubblePosition[] {
  const pos = positions.map((p) => ({ ...p }));
  for (let iter = 0; iter < iterations; iter++) {
    let anyOverlap = false;
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j].x - pos[i].x;
        const dy = pos[j].y - pos[i].y;
        const dist = Math.hypot(dx, dy);
        const minDist = pos[i].r + pos[j].r + gap;
        if (dist < minDist) {
          anyOverlap = true;
          const overlap = (minDist - dist) / 2;
          const nx = dist > 0 ? dx / dist : 1;
          const ny = dist > 0 ? dy / dist : 0;
          pos[i].x -= nx * overlap;
          pos[i].y -= ny * overlap;
          pos[j].x += nx * overlap;
          pos[j].y += ny * overlap;
        }
      }
    }
    if (!anyOverlap) break;
  }
  return pos;
}

// ── Canvas bounds ────────────────────────────────────────────────────────────

export const CANVAS_PAD = 12;

export function computeCanvasDimensions(positions: BubblePosition[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const { x, y, r } of positions) {
    minX = Math.min(minX, x - r);
    maxX = Math.max(maxX, x + r);
    minY = Math.min(minY, y - r);
    maxY = Math.max(maxY, y + r);
  }
  return {
    w: Math.ceil(maxX - minX + CANVAS_PAD * 2),
    h: Math.ceil(maxY - minY + CANVAS_PAD * 2),
    ox: -minX + CANVAS_PAD,
    oy: -minY + CANVAS_PAD,
  };
}

/** Returns the axis-aligned bounding box of a w×h rectangle rotated by `deg` degrees. */
export function rotatedBounds(w: number, h: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return { rw: Math.ceil(w * cos + h * sin), rh: Math.ceil(w * sin + h * cos) };
}
