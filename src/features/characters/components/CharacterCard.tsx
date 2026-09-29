import { Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { Link } from 'react-router';
import { CHARACTER_CARD } from '@/constants/ui';

import type { Quality } from '@/types/quality';
import { getCharacterRoutePathByName } from '@/features/characters/utils/character-route';
import NoteTooltipIcon from '@/components/ui/NoteTooltipIcon';
import TierBadge from '@/components/ui/TierBadge';
import CharacterPortrait from './CharacterPortrait';

interface CharacterCardProps {
  name: string;
  /** Override the displayed name label without affecting portrait asset lookup. */
  label?: string;
  quality?: Quality;
  size?: number;
  disableLink?: boolean;
  tierLabel?: string;
  note?: string;
  routePath?: string;
  clampName?: boolean;
  isNew?: boolean;
  isUpdated?: boolean;
}

export default function CharacterCard({
  name,
  label,
  quality,
  size = CHARACTER_CARD.PORTRAIT_SIZE,
  disableLink = false,
  tierLabel,
  note,
  routePath,
  clampName = true,
  isNew = false,
  isUpdated = false,
}: CharacterCardProps) {
  const portrait = (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <CharacterPortrait
        name={name}
        size={size}
        quality={quality}
        borderWidth={CHARACTER_CARD.BORDER_WIDTH}
        routePath={routePath}
        isNew={isNew}
        isUpdated={isUpdated}
      />
      {note && (
        <NoteTooltipIcon
          note={note}
          ariaLabel={`Show note for ${name}`}
          stopPropagation
          wrapperStyle={{
            position: 'absolute',
            top: 0,
            right: 0,
          }}
        />
      )}
    </div>
  );

  const content = (
    <Stack gap={2} align="center">
      {portrait}
      <Group
        gap={4}
        justify="center"
        wrap="nowrap"
        style={{ maxWidth: '100%' }}
      >
        <Text
          size="xs"
          fw={500}
          ta="center"
          lineClamp={clampName ? 1 : undefined}
          c={disableLink ? 'dimmed' : undefined}
          className={disableLink ? undefined : 'dt-link-text'}
          style={{
            minWidth: 0,
            whiteSpace: clampName ? undefined : 'normal',
          }}
        >
          {label ?? name}
        </Text>
        {tierLabel && (
          <TierBadge tier={tierLabel} size="xs" style={{ flexShrink: 0 }} />
        )}
      </Group>
    </Stack>
  );

  if (disableLink) {
    return content;
  }

  return (
    <UnstyledButton
      component={Link}
      to={routePath ?? getCharacterRoutePathByName(name)}
      className="character-card-btn"
    >
      {content}
    </UnstyledButton>
  );
}
