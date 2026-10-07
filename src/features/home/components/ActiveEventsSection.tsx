import ExpandableText from '@/components/ui/ExpandableText';
import { STATIC_SURFACE_CLASS_NAME } from '@/components/ui/Surface';
import GlobalBadge from '@/components/ui/GlobalBadge';
import EventBanner from '@/features/wiki/events/components/EventBanner';
import EventCharacterAvatars from '@/features/wiki/events/components/EventCharacterAvatars';
import { EventCardsLoading } from '@/components/layout/PageLoadingSkeleton';
import { useEvents } from '@/features/wiki/hooks/use-wiki-data';
import { useGradientAccent } from '@/hooks';
import type { GameEvent } from '@/features/wiki/events/types';
import { getEventTypeColor, isGameEventActive } from '@/utils/event-utils';
import { Badge, Card, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';
import HomeSectionError from './HomeSectionError';

export default function ActiveEventsSection() {
  const { accent } = useGradientAccent();
  const { data: events, loading, error, retry } = useEvents();

  const activeEvents = useMemo<GameEvent[]>(() => {
    return events
      .filter(isGameEventActive)
      .sort((a, b) => (b.start_date ?? '').localeCompare(a.start_date ?? ''))
      .slice(0, 3);
  }, [events]);

  if (loading) {
    return <EventCardsLoading cards={3} bannerHeight={130} spacing="sm" />;
  }

  if (error) {
    return (
      <HomeSectionError message="Could not load events." onRetry={retry} />
    );
  }

  if (activeEvents.length === 0) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        No active events at the moment.
      </Text>
    );
  }

  return (
    <SimpleGrid
      cols={{
        base: 1,
        sm: activeEvents.length > 1 ? 2 : 1,
        md: activeEvents.length,
      }}
      spacing="sm"
    >
      {activeEvents.map((event) => {
        const id =
          event.event_id ??
          (event.is_global
            ? `global:${event.name}`
            : `tw:${event.name}:${event.start_date ?? event.name}`);
        const typeColor = event.is_global
          ? accent.primary
          : getEventTypeColor(event.type);
        return (
          <Card
            key={id}
            className={STATIC_SURFACE_CLASS_NAME}
            padding={0}
            radius="md"
            withBorder
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            <Card.Section>
              <EventBanner
                characters={event.characters}
                eventName={event.slug}
                height={130}
                radius="0"
                alt={event.name}
              />
            </Card.Section>
            <Stack gap="xs" p="md" style={{ flex: 1 }}>
              <Group gap="xs" wrap="wrap">
                <GlobalBadge isGlobal={event.is_global} size="sm" />
                {event.type && (
                  <Badge
                    size="xs"
                    variant="light"
                    color={typeColor}
                    radius="sm"
                  >
                    {event.type}
                  </Badge>
                )}
              </Group>
              <Text size="sm" fw={600} lineClamp={2}>
                {event.name}
              </Text>
              {event.characters.length > 0 && (
                <EventCharacterAvatars characters={event.characters} />
              )}
              {event.description && (
                <ExpandableText size="xs">{event.description}</ExpandableText>
              )}
              {(event.start_date || event.end_date) && (
                <Stack gap={2} mt="auto">
                  {event.start_date && (
                    <Text size="xs" c="dimmed">
                      Started: {event.start_date}
                    </Text>
                  )}
                  {event.end_date && (
                    <Text size="xs" c="dimmed">
                      Ends: {event.end_date}
                    </Text>
                  )}
                </Stack>
              )}
            </Stack>
          </Card>
        );
      })}
    </SimpleGrid>
  );
}
