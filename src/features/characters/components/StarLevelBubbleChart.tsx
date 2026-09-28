import SafeImage from '@/components/ui/SafeImage';
import { getPortrait } from '@/assets';
import { QUALITY_BORDER_COLOR } from '@/constants/quality';
import { CharacterOwnershipContext, CharacterSkinContext } from '@/contexts';
import type { Character } from '@/features/characters/types';
import {
  getCharacterIdentityKey,
  getCharacterRouteSlug,
} from '@/features/characters/utils/character-route';
import { useStarLevels } from '@/features/wiki/hooks/use-wiki-data';
import { useDarkMode, useGradientAccent } from '@/hooks';
import { buildStarLevels } from '@/features/wiki/star-levels/star-levels';
import type { StarLevel, StarTier } from '@/features/wiki/star-levels/types';
import { STORAGE_KEY } from '@/constants/ui';
import {
  downloadElementAsImage,
  DARK_BACKGROUND,
  LIGHT_BACKGROUND,
} from '@/utils/export-image';
import {
  ActionIcon,
  Box,
  Collapse,
  Divider,
  Group,
  Modal,
  Slider,
  Stack,
  Tabs,
  Text,
  Tooltip,
} from '@mantine/core';
import * as d3 from 'd3-hierarchy';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  IoAdd,
  IoBarChart,
  IoContract,
  IoDownload,
  IoExpand,
  IoRefresh,
  IoRemove,
  IoScanOutline,
  IoSettings,
} from 'react-icons/io5';
import {
  TransformComponent,
  TransformWrapper,
  useControls,
} from 'react-zoom-pan-pinch';

// ── Tier glow colors & order ─────────────────────────────────────────────────

const TIER_ORDER: Record<StarTier, number> = {
  base: 0,
  purple: 1,
  red: 2,
  legendary: 3,
  divine: 4,
};

// Rendered on an HTML5 canvas, not through CSS, so these can't reference
// Mantine/--dt-* tokens. Intentionally static across light/dark — the glow
// is decorative and reads fine on both canvas backgrounds.
const TIER_GLOW: Record<StarTier, string> = {
  base: '#9e9e9e',
  purple: '#ce93d8',
  red: '#ef9a9a',
  legendary: '#ffcc02',
  divine: '#80deea',
};

// ── Chart config ─────────────────────────────────────────────────────────────

interface ChartConfig {
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

const DEFAULT_CONFIG: ChartConfig = {
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

function getBubbleRadius(
  copies: number,
  baseSize: number,
  scale: number,
  exponent: number,
): number {
  return Math.round(baseSize + Math.pow(Math.max(copies, 1), exponent) * scale);
}

// ── Types ───────────────────────────────────────────────────────────────────

interface BubbleItem {
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

// ── D3 circle packing ────────────────────────────────────────────────────────

const PACK_SIZE = 900;

/**
 * Packs bubbles with d3, sorting by size in the specified direction.
 * Returns positions indexed to match the original `bubbles` array order.
 *
 * Stretch is baked in: radii are divided by `max(sx, sy)` before packing so
 * that after scaling positions by `(sx, sy)` circles touch along the major
 * axis. Minor-axis overlaps from the approximation are resolved separately.
 */
function packWithD3(
  bubbles: BubbleItem[],
  padding: number,
  largeOutside = false,
  sx = 1,
  sy = 1,
): Array<{ x: number; y: number; r: number }> {
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

  const result = new Array<{ x: number; y: number; r: number }>(bubbles.length);
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
function resolveOverlaps(
  positions: Array<{ x: number; y: number; r: number }>,
  iterations = 30,
  gap = 2,
): Array<{ x: number; y: number; r: number }> {
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

const CANVAS_PAD = 12;

function computeCanvasDimensions(
  positions: Array<{ x: number; y: number; r: number }>,
) {
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
function rotatedBounds(w: number, h: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return { rw: Math.ceil(w * cos + h * sin), rh: Math.ceil(w * sin + h * cos) };
}

// ── Chart canvas ─────────────────────────────────────────────────────────────

interface BubbleCanvasProps {
  bubbles: BubbleItem[];
  /** Packed positions with actual radii from d3, in the same order as bubbles. */
  positions: Array<{ x: number; y: number; r: number }>;
  config: ChartConfig;
  interactive: boolean;
}

function BubbleCanvas({
  bubbles,
  positions,
  config,
  interactive,
}: BubbleCanvasProps) {
  if (bubbles.length === 0) {
    return (
      <Text c="dimmed" size="sm" ta="center" py="xl">
        No owned characters to display. Set star levels in My Characters.
      </Text>
    );
  }

  const { w, h, ox, oy } = computeCanvasDimensions(positions);

  return (
    <Box
      style={{ position: 'relative', width: w, height: h, margin: '0 auto' }}
    >
      {bubbles.map((b, idx) => {
        const { x, y, r } = positions[idx];
        const cx = x + ox;
        const cy = y + oy;
        const d = r * 2;
        const opacity =
          config.tierFade === 0
            ? 1
            : 1 - config.tierFade * (1 - TIER_ORDER[b.starLevel.tier] / 4);

        const a1 = Math.round(0x99 * config.glowIntensity)
          .toString(16)
          .padStart(2, '0');
        const a2 = Math.round(0x66 * config.glowIntensity)
          .toString(16)
          .padStart(2, '0');

        const inner = (
          <Box
            key={b.identityKey}
            style={{
              position: 'absolute',
              left: Math.round(cx - r),
              top: Math.round(cy - r),
              width: d,
              height: d,
              borderRadius: '50%',
              overflow: 'hidden',
              opacity,
              border: `${config.borderThickness}px solid ${b.qualityBorder}`,
              boxShadow: `0 0 0 1.5px ${b.tierColor}${a1}, 0 0 ${config.glowRadius}px ${b.tierColor}${a2}`,
              cursor: interactive ? 'pointer' : undefined,
            }}
          >
            <SafeImage
              src={b.portrait}
              alt={b.char.name}
              style={{ width: '100%', height: '100%', display: 'block' }}
              fit="cover"
            />
          </Box>
        );

        if (!interactive) return inner;

        return (
          <Tooltip
            key={b.identityKey}
            label={`${b.displayName} · ${b.starLevel.label} · ${b.starLevel.copies} ${b.starLevel.copies === 1 ? 'copy' : 'copies'}`}
            withArrow
            withinPortal
          >
            {inner}
          </Tooltip>
        );
      })}
    </Box>
  );
}

// ── Zoom controls ────────────────────────────────────────────────────────────

function ZoomControls({
  accent,
  isFullscreen,
  onToggleFullscreen,
}: {
  accent: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const { zoomIn, zoomOut, centerView } = useControls();
  return (
    <Group
      gap={4}
      style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 10 }}
    >
      <Tooltip label="Zoom in" withArrow>
        <ActionIcon
          aria-label="Zoom in"
          variant="light"
          color={accent}
          size="sm"
          onClick={() => zoomIn()}
        >
          <IoAdd size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Zoom out" withArrow>
        <ActionIcon
          aria-label="Zoom out"
          variant="light"
          color={accent}
          size="sm"
          onClick={() => zoomOut()}
        >
          <IoRemove size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Reset view" withArrow>
        <ActionIcon
          aria-label="Reset view"
          variant="light"
          color={accent}
          size="sm"
          onClick={() => centerView(1)}
        >
          <IoScanOutline size={13} />
        </ActionIcon>
      </Tooltip>
      <Tooltip
        label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        withArrow
      >
        <ActionIcon
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          variant="light"
          color={accent}
          size="sm"
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? <IoContract size={13} /> : <IoExpand size={13} />}
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}

// ── Settings slider row ───────────────────────────────────────────────────────

interface SliderRowProps {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  accent: string;
  onChange: (v: number) => void;
}

function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  accent,
  onChange,
}: SliderRowProps) {
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          {label}
        </Text>
        <Text size="xs" c="dimmed">
          {display}
        </Text>
      </Group>
      <Slider
        size="xs"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        color={accent}
      />
    </Stack>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

interface StarLevelBubbleChartProps {
  characters: Character[];
  opened: boolean;
  onClose: () => void;
}

export default function StarLevelBubbleChart({
  characters,
  opened,
  onClose,
}: StarLevelBubbleChartProps) {
  const { ownedCharacters } = useContext(CharacterOwnershipContext);
  const { getDisplaySkin } = useContext(CharacterSkinContext);
  const { data: rawStarLevels } = useStarLevels();
  const starLevels = useMemo(
    () => buildStarLevels(rawStarLevels),
    [rawStarLevels],
  );
  const starLevelMap = useMemo(
    () => new Map(starLevels.map((sl) => [sl.value, sl])),
    [starLevels],
  );
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();

  const [isExporting, setIsExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState<ChartConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY.BUBBLE_CHART_CONFIG);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ChartConfig>;
        return { ...DEFAULT_CONFIG, ...parsed };
      }
    } catch {
      // ignore corrupted data
    }
    return DEFAULT_CONFIG;
  });
  const exportRef = useRef<HTMLDivElement>(null);

  const charByIdentity = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) map.set(getCharacterIdentityKey(c), c);
    return map;
  }, [characters]);

  const bubbles = useMemo((): BubbleItem[] => {
    const items: BubbleItem[] = [];
    for (const [identityKey, levelValue] of Object.entries(ownedCharacters)) {
      const char = charByIdentity.get(identityKey);
      const starLevel = starLevelMap.get(levelValue);
      if (!char || !starLevel) continue;
      items.push({
        identityKey,
        char,
        starLevel,
        displayName: char.name,
        r: getBubbleRadius(
          starLevel.copies,
          config.baseSize,
          config.scale,
          config.sizeExponent,
        ),
        portrait: getPortrait(
          char.name,
          getCharacterRouteSlug(char),
          getDisplaySkin(getCharacterRouteSlug(char)),
        ),
        tierColor: TIER_GLOW[starLevel.tier],
        qualityBorder: QUALITY_BORDER_COLOR[char.quality] ?? '#9e9e9e',
      });
    }
    return items.sort((a, b) => b.r - a.r);
  }, [
    ownedCharacters,
    charByIdentity,
    starLevelMap,
    config.baseSize,
    config.scale,
    config.sizeExponent,
    getDisplaySkin,
  ]);

  const positions = useMemo(() => {
    const { padding, centerBias, stretchX, stretchY } = config;
    const posCenter = packWithD3(bubbles, padding, false, stretchX, stretchY);
    const t = centerBias;
    const lerped =
      t === 0
        ? posCenter
        : (() => {
            const posOutside = packWithD3(
              bubbles,
              padding,
              true,
              stretchX,
              stretchY,
            );
            return bubbles.map((_, i) => ({
              x: posCenter[i].x * (1 - t) + posOutside[i].x * t,
              y: posCenter[i].y * (1 - t) + posOutside[i].y * t,
              r: posCenter[i].r,
            }));
          })();
    const needsResolve = t !== 0 || stretchX !== 1 || stretchY !== 1;
    return needsResolve ? resolveOverlaps(lerped) : lerped;
  }, [bubbles, config]);

  useEffect(() => {
    if (!isExporting) return;
    const el = exportRef.current;
    if (!el) {
      setIsExporting(false);
      return;
    }
    const run = async () => {
      await new Promise((r) => setTimeout(r, 200));
      try {
        await downloadElementAsImage(el, 'character-investment-chart', isDark);
      } finally {
        setIsExporting(false);
      }
    };
    run();
  }, [isExporting, isDark]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY.BUBBLE_CHART_CONFIG,
      JSON.stringify(config),
    );
  }, [config]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      chartContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const ownedCount = Object.keys(ownedCharacters).length;

  const set = (key: keyof ChartConfig) => (v: number) =>
    setConfig((c) => ({ ...c, [key]: v }));

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        title={
          <Group gap="xs">
            <IoBarChart size={16} />
            <Text fw={600}>Investment Chart</Text>
            {ownedCount > 0 && (
              <Text size="sm" c="dimmed">
                ({ownedCount} characters)
              </Text>
            )}
          </Group>
        }
        size="xl"
        lockScroll={false}
      >
        <Stack gap="sm">
          {/* Toolbar */}
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              Circle size reflects copies invested. Border = quality. Glow =
              star tier.
            </Text>
            <Group gap={4}>
              <Tooltip label="Chart settings" withArrow>
                <ActionIcon
                  variant={settingsOpen ? 'filled' : 'light'}
                  color={accent.primary}
                  size="sm"
                  onClick={() => setSettingsOpen((o) => !o)}
                  aria-label="Chart settings"
                >
                  <IoSettings size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Export as image" withArrow>
                <ActionIcon
                  variant="light"
                  color={accent.primary}
                  size="sm"
                  loading={isExporting}
                  onClick={() => setIsExporting(true)}
                  aria-label="Export investment chart"
                  disabled={bubbles.length === 0}
                >
                  <IoDownload size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Settings panel */}
          <Collapse expanded={settingsOpen}>
            <Stack
              gap="xs"
              p="sm"
              style={{
                borderRadius: 8,
                border: '1px solid var(--mantine-color-default-border)',
              }}
            >
              <Group justify="space-between" align="center">
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                  Settings
                </Text>
                <Tooltip label="Reset to defaults" withArrow>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={() => setConfig(DEFAULT_CONFIG)}
                    aria-label="Reset chart settings"
                  >
                    <IoRefresh size={13} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Divider mt={2} mb={2} />

              <Tabs
                defaultValue="layout"
                variant="pills"
                color={accent.primary}
              >
                <Tabs.List>
                  <Tabs.Tab value="layout" fz="xs">
                    Layout
                  </Tabs.Tab>
                  <Tabs.Tab value="shape" fz="xs">
                    Shape
                  </Tabs.Tab>
                  <Tabs.Tab value="style" fz="xs">
                    Style
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="layout" pt="sm">
                  <Stack gap="sm">
                    <SliderRow
                      label="Min size"
                      display={`${config.baseSize}px`}
                      min={8}
                      max={40}
                      step={1}
                      value={config.baseSize}
                      accent={accent.primary}
                      onChange={set('baseSize')}
                    />
                    <SliderRow
                      label="Size scale"
                      display={`${config.scale}×`}
                      min={2}
                      max={16}
                      step={0.5}
                      value={config.scale}
                      accent={accent.primary}
                      onChange={set('scale')}
                    />
                    <SliderRow
                      label="Size contrast"
                      display={config.sizeExponent.toFixed(2)}
                      min={0.3}
                      max={1.5}
                      step={0.05}
                      value={config.sizeExponent}
                      accent={accent.primary}
                      onChange={set('sizeExponent')}
                    />
                    <SliderRow
                      label="Padding"
                      display={`${config.padding}px`}
                      min={0}
                      max={20}
                      step={1}
                      value={config.padding}
                      accent={accent.primary}
                      onChange={set('padding')}
                    />
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="shape" pt="sm">
                  <Stack gap="sm">
                    <SliderRow
                      label="Large circles outward"
                      display={config.centerBias.toFixed(2)}
                      min={0}
                      max={1}
                      step={0.05}
                      value={config.centerBias}
                      accent={accent.primary}
                      onChange={set('centerBias')}
                    />
                    <SliderRow
                      label="Horizontal stretch"
                      display={`${config.stretchX.toFixed(2)}×`}
                      min={0.5}
                      max={2}
                      step={0.05}
                      value={config.stretchX}
                      accent={accent.primary}
                      onChange={set('stretchX')}
                    />
                    <SliderRow
                      label="Vertical stretch"
                      display={`${config.stretchY.toFixed(2)}×`}
                      min={0.5}
                      max={2}
                      step={0.05}
                      value={config.stretchY}
                      accent={accent.primary}
                      onChange={set('stretchY')}
                    />
                    <SliderRow
                      label="Rotation"
                      display={`${config.rotation}°`}
                      min={0}
                      max={360}
                      step={1}
                      value={config.rotation}
                      accent={accent.primary}
                      onChange={set('rotation')}
                    />
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="style" pt="sm">
                  <Stack gap="sm">
                    <SliderRow
                      label="Glow intensity"
                      display={`${Math.round(config.glowIntensity * 100)}%`}
                      min={0}
                      max={1}
                      step={0.05}
                      value={config.glowIntensity}
                      accent={accent.primary}
                      onChange={set('glowIntensity')}
                    />
                    <SliderRow
                      label="Glow radius"
                      display={`${config.glowRadius}px`}
                      min={2}
                      max={40}
                      step={1}
                      value={config.glowRadius}
                      accent={accent.primary}
                      onChange={set('glowRadius')}
                    />
                    <SliderRow
                      label="Border thickness"
                      display={`${config.borderThickness}px`}
                      min={0}
                      max={6}
                      step={0.5}
                      value={config.borderThickness}
                      accent={accent.primary}
                      onChange={set('borderThickness')}
                    />
                    <SliderRow
                      label="Tier fade"
                      display={`${Math.round(config.tierFade * 100)}%`}
                      min={0}
                      max={1}
                      step={0.05}
                      value={config.tierFade}
                      accent={accent.primary}
                      onChange={set('tierFade')}
                    />
                  </Stack>
                </Tabs.Panel>
              </Tabs>
            </Stack>
          </Collapse>

          {/* Chart */}
          <Box
            ref={chartContainerRef}
            style={{
              position: 'relative',
              height: '60vh',
              overflow: 'hidden',
              borderRadius: 8,
              border: '1px solid var(--mantine-color-default-border)',
              cursor: 'grab',
            }}
          >
            <TransformWrapper
              minScale={0.2}
              maxScale={4}
              centerOnInit
              limitToBounds={false}
            >
              <ZoomControls
                accent={accent.primary}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ padding: 24 }}
              >
                <div
                  style={{
                    transform:
                      config.rotation !== 0
                        ? `rotate(${config.rotation}deg)`
                        : undefined,
                    transformOrigin: 'center center',
                  }}
                >
                  <BubbleCanvas
                    bubbles={bubbles}
                    positions={positions}
                    config={config}
                    interactive
                  />
                </div>
              </TransformComponent>
            </TransformWrapper>
          </Box>
        </Stack>
      </Modal>

      {isExporting && (
        <Box
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: '-100000px',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <Box
            ref={exportRef}
            style={{
              display: 'inline-block',
              backgroundColor: isDark ? DARK_BACKGROUND : LIGHT_BACKGROUND,
              padding: 24,
            }}
          >
            <Stack gap="sm" mb={12}>
              <Group gap="xs">
                <IoBarChart size={18} />
                <Text fw={700} size="lg">
                  Character Investment Chart
                </Text>
              </Group>
              <Text size="sm" c="dimmed">
                {ownedCount} characters · circle size = copies invested
              </Text>
            </Stack>
            {(() => {
              const canvas = (
                <BubbleCanvas
                  bubbles={bubbles}
                  positions={positions}
                  config={config}
                  interactive={false}
                />
              );
              if (config.rotation === 0 || bubbles.length === 0) return canvas;
              const { w, h } = computeCanvasDimensions(positions);
              const { rw, rh } = rotatedBounds(w, h, config.rotation);
              return (
                <Box style={{ position: 'relative', width: rw, height: rh }}>
                  <Box
                    style={{
                      position: 'absolute',
                      left: (rw - w) / 2,
                      top: (rh - h) / 2,
                      width: w,
                      height: h,
                      transform: `rotate(${config.rotation}deg)`,
                      transformOrigin: 'center center',
                    }}
                  >
                    {canvas}
                  </Box>
                </Box>
              );
            })()}
          </Box>
        </Box>
      )}
    </>
  );
}
