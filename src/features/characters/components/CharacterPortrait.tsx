import { getPortrait } from '@/assets';
import { QUALITY_BORDER_COLOR } from '@/constants/quality';
import { getCharacterPortraitHoverProps } from '@/constants/styles';
import { CharacterOwnershipContext, CharacterSkinContext } from '@/contexts';
import { getCharacterRoutePathByName } from '@/features/characters/utils/character-route';
import type { Quality } from '@/types/quality';
import SafeImage from '@/components/ui/SafeImage';
import { Tooltip, type TooltipProps } from '@mantine/core';
import type { CSSProperties, ReactNode } from 'react';
import { useContext } from 'react';
import { Link } from 'react-router';
import { useMobileTooltip } from '@/hooks';

interface CharacterPortraitProps {
  name: string;
  size: number;
  /** Overrides the image's accessible name. Pass "" when a sibling label already names the character, to avoid double announcement. */
  alt?: string;
  quality?: Quality;
  borderWidth?: number;
  borderColor?: string;
  isSubstitute?: boolean;
  link?: boolean;
  tooltip?: ReactNode;
  tooltipProps?: Partial<TooltipProps>;
  loading?: 'lazy' | 'eager';
  fit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  className?: string;
  style?: CSSProperties;
  fallbackSrc?: string;
  routePath?: string;
  assetKey?: string;
  /** Shows the newest-addition-batch corner badge. Takes priority over `isUpdated`. */
  isNew?: boolean;
  /** Shows the newest-content-edit corner badge (ignored when `isNew` is set). */
  isUpdated?: boolean;
  /** Renders this exact skin slug, bypassing the global "Show character skins" toggle. */
  skinOverride?: string;
}

const CORNER_BADGE_BY_KIND = {
  new: { label: 'New', color: 'var(--mantine-color-green-6)' },
  updated: { label: 'Updated', color: 'var(--mantine-color-blue-6)' },
} as const;

function CornerBadge({
  kind,
  size,
}: {
  kind: keyof typeof CORNER_BADGE_BY_KIND;
  size: number;
}) {
  const { label, color } = CORNER_BADGE_BY_KIND[kind];

  // Scale font and padding with portrait size
  const fontSize = Math.max(9, Math.round(size * 0.12));
  const padV = Math.max(1, Math.round(fontSize * 0.3));
  const padH = Math.max(3, Math.round(fontSize * 0.55));
  const badgeRadius = Math.max(3, Math.round(fontSize * 0.4));
  // 45° point on circle edge: distance from each side = size * (1 - 1/√2) / 2 ≈ size * 0.146
  // translate(-50%, -50%) centers the badge on that exact point
  const edge = Math.round(size * 0.146);

  return (
    <span
      style={{
        position: 'absolute',
        top: edge,
        right: edge,
        transform: 'translate(50%, -50%)',
        background: color,
        color: 'white',
        borderRadius: badgeRadius,
        fontSize,
        fontWeight: 700,
        lineHeight: 1,
        padding: `${padV}px ${padH}px`,
        letterSpacing: '0.04em',
        pointerEvents: 'none',
        userSelect: 'none',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        whiteSpace: 'nowrap',
        zIndex: 1,
      }}
    >
      {label}
    </span>
  );
}

export default function CharacterPortrait({
  name,
  size,
  alt,
  quality,
  borderWidth = 2,
  borderColor,
  isSubstitute = false,
  link = false,
  tooltip,
  tooltipProps,
  loading = 'lazy',
  fit = 'cover',
  className,
  style,
  fallbackSrc,
  routePath,
  assetKey,
  isNew = false,
  isUpdated = false,
  skinOverride,
}: CharacterPortraitProps) {
  const mobileTooltip = useMobileTooltip();
  const {
    characterTrackingEnabled,
    grayUnowned,
    isOwned,
    showNewUpdatedBadges,
  } = useContext(CharacterOwnershipContext);
  const { getDisplaySkin } = useContext(CharacterSkinContext);
  const routeAssetKey = routePath?.match(/^\/characters\/([^/?#]+)/)?.[1];
  const resolvedAssetKey = assetKey ?? routeAssetKey;
  const selectedSkin =
    skinOverride ??
    (resolvedAssetKey ? getDisplaySkin(resolvedAssetKey) : 'default');
  const resolvedBorderColor =
    borderColor ??
    (quality ? QUALITY_BORDER_COLOR[quality] : 'var(--mantine-color-gray-5)');

  // routeAssetKey is the character slug extracted from the route path — use it as the ownership key.
  // Only dim when we have a slug to look up, preventing false matches on portrait-only usages.
  const dimmed =
    characterTrackingEnabled &&
    grayUnowned &&
    routeAssetKey != null &&
    !isOwned(routeAssetKey);

  const portrait = (
    <SafeImage
      src={getPortrait(name, resolvedAssetKey, selectedSkin)}
      alt={alt ?? name}
      w={size}
      h={size}
      fit={fit}
      radius="50%"
      loading={loading}
      className={[
        getCharacterPortraitHoverProps({ isSubstitute }).className,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...(borderWidth > 0
          ? {
              border: `${borderWidth}px solid ${resolvedBorderColor}`,
              borderRadius: '50%',
            }
          : {}),
        opacity: dimmed ? 0.35 : isSubstitute ? 0.9 : 1,
        filter: dimmed ? 'grayscale(1)' : undefined,
        transition: 'opacity 150ms ease, filter 150ms ease',
        ...style,
      }}
      fallbackSrc={
        fallbackSrc ??
        (selectedSkin !== 'default'
          ? getPortrait(name, resolvedAssetKey, 'default')
          : `https://placehold.co/${size}x${size}?text=${encodeURIComponent(name.charAt(0))}`)
      }
    />
  );

  const linkedPortrait = link ? (
    <Link
      to={routePath ?? getCharacterRoutePathByName(name)}
      style={{ display: 'inline-flex', textDecoration: 'none' }}
      aria-label={`View ${name}`}
    >
      {portrait}
    </Link>
  ) : (
    portrait
  );

  const result = tooltip ? (
    <Tooltip label={tooltip} {...mobileTooltip} {...tooltipProps}>
      {linkedPortrait}
    </Tooltip>
  ) : (
    linkedPortrait
  );

  if (!showNewUpdatedBadges || (!isNew && !isUpdated)) return result;

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {result}
      <CornerBadge kind={isNew ? 'new' : 'updated'} size={size} />
    </div>
  );
}
