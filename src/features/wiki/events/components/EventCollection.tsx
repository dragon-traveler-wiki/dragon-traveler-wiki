import { Badge, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import ExpandableText from '@/components/ui/ExpandableText';
import GlobalBadge from '@/components/ui/GlobalBadge';
import {
  STATIC_SURFACE_CLASS_NAME,
  StaticSurface,
} from '@/components/ui/Surface';
import { EVENT_GRID_COLS } from '@/constants/ui';
import type { Character } from '@/features/characters/types';
import EventBanner from '@/features/wiki/events/components/EventBanner';
import { EventCharacterAvatarList } from '@/features/wiki/events/components/EventCharacterAvatars';
import type { EventEntry } from '@/features/wiki/events/filters';
import type { GameEvent } from '@/features/wiki/events/types';
import type { ViewMode } from '@/hooks';
import { useGradientAccent } from '@/hooks';
import { getEventTypeColor } from '@/utils/event-utils';

function EventBadges({
  event,
  active,
  globalColor,
}: {
  event: GameEvent;
  active: boolean;
  globalColor: string;
}) {
  const typeColor = event.is_global
    ? globalColor
    : getEventTypeColor(event.type);

  return (
    <Group gap="xs" wrap="wrap">
      <GlobalBadge isGlobal={event.is_global} size="sm" />
      {event.type ? (
        <Badge size="xs" variant="light" color={typeColor} radius="sm">
          {event.type}
        </Badge>
      ) : null}
      <Badge
        size="xs"
        variant="light"
        color={active ? 'green' : 'gray'}
        radius="sm"
      >
        {active ? 'Active' : 'Ended'}
      </Badge>
    </Group>
  );
}

function EventDates({
  event,
  active,
  size = 'sm',
}: {
  event: GameEvent;
  active: boolean;
  size?: 'xs' | 'sm';
}) {
  return (
    <Group gap="md" wrap="wrap" mt="auto">
      {event.start_date ? (
        <Text size={size}>
          <Text span c="dimmed">
            Started:
          </Text>{' '}
          {event.start_date}
        </Text>
      ) : null}
      {event.end_date ? (
        <Text size={size}>
          <Text span c="dimmed">
            {active ? 'Ends:' : 'Ended:'}
          </Text>{' '}
          {event.end_date}
        </Text>
      ) : null}
    </Group>
  );
}

function EventCard({
  entry,
  globalColor,
  characterByIdentity,
}: {
  entry: EventEntry;
  globalColor: string;
  characterByIdentity: Map<string, Character>;
}) {
  const { active, event } = entry;
  return (
    <Card
      className={STATIC_SURFACE_CLASS_NAME}
      radius="md"
      withBorder
      padding={0}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      <Card.Section style={{ position: 'relative' }}>
        <EventBanner
          characters={event.characters}
          eventName={event.slug}
          height={160}
          radius="0"
        />
      </Card.Section>
      <Stack gap="xs" p="md" style={{ flex: 1 }}>
        <EventBadges event={event} active={active} globalColor={globalColor} />
        <Text fw={600} size="md" lineClamp={2}>
          {event.name}
        </Text>
        {event.characters.length > 0 ? (
          <EventCharacterAvatarList
            characters={event.characters}
            characterByIdentity={characterByIdentity}
          />
        ) : null}
        {event.description ? (
          <ExpandableText>{event.description}</ExpandableText>
        ) : null}
        <EventDates event={event} active={active} size="xs" />
      </Stack>
    </Card>
  );
}

function EventListItem({
  entry,
  globalColor,
  characterByIdentity,
}: {
  entry: EventEntry;
  globalColor: string;
  characterByIdentity: Map<string, Character>;
}) {
  const { active, event } = entry;
  return (
    <StaticSurface p="md">
      <Group align="stretch" gap="md" wrap="nowrap">
        <EventBanner
          characters={event.characters}
          eventName={event.slug}
          height={96}
          width={160}
          visibleFrom="sm"
        />
        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <EventBadges
            event={event}
            active={active}
            globalColor={globalColor}
          />
          <Text fw={600} size="lg">
            {event.name}
          </Text>
          {event.characters.length > 0 ? (
            <EventCharacterAvatarList
              characters={event.characters}
              characterByIdentity={characterByIdentity}
            />
          ) : null}
          {event.description ? (
            <ExpandableText>{event.description}</ExpandableText>
          ) : null}
          <EventDates event={event} active={active} />
        </Stack>
      </Group>
    </StaticSurface>
  );
}

export default function EventCollection({
  entries,
  viewMode,
  characterByIdentity,
}: {
  entries: EventEntry[];
  viewMode: ViewMode;
  characterByIdentity: Map<string, Character>;
}) {
  const { accent } = useGradientAccent();

  if (viewMode === 'list') {
    return (
      <Stack gap="md">
        {entries.map((entry) => (
          <EventListItem
            key={entry.id}
            entry={entry}
            globalColor={accent.primary}
            characterByIdentity={characterByIdentity}
          />
        ))}
      </Stack>
    );
  }

  return (
    <SimpleGrid cols={EVENT_GRID_COLS} spacing="md">
      {entries.map((entry) => (
        <EventCard
          key={entry.id}
          entry={entry}
          globalColor={accent.primary}
          characterByIdentity={characterByIdentity}
        />
      ))}
    </SimpleGrid>
  );
}
