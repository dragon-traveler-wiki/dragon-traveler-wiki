import type { Illustration } from '@/assets';
import SafeImage from '@/components/ui/SafeImage';
import SafeVideo from '@/components/ui/SafeVideo';
import { StaticSurface } from '@/components/ui/Surface';
import { ILLUSTRATION_PANEL, NAV_ITEM_HEIGHT } from '@/constants/ui';
import { LoadingRegion } from '@/components/layout/PageLoadingSkeleton';
import { useGradientAccent, useIsMobile } from '@/hooks';
import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Group,
  Select,
  Skeleton,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IoChevronBack,
  IoChevronForward,
  IoExpand,
  IoStar,
  IoStarOutline,
} from 'react-icons/io5';
import type { ReactNode } from 'react';

interface CharacterIllustrationPanelProps {
  characterName: string;
  loading: boolean;
  skinOptions: Array<{ value: string; label: string }>;
  selectedSkinSlug: string | null;
  onSkinChange: (slug: string | null) => void;
  activeIllustration: Illustration | null;
  activeIllustrationIndex: number;
  illustrationsLength: number;
  hasMultipleIllustrations: boolean;
  onOpenPreview: () => void;
  onPrevious: () => void;
  onNext: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  modelAction?: ReactNode;
}

export default function CharacterIllustrationPanel({
  characterName,
  loading,
  skinOptions,
  selectedSkinSlug,
  onSkinChange,
  activeIllustration,
  activeIllustrationIndex,
  illustrationsLength,
  hasMultipleIllustrations,
  onOpenPreview,
  onPrevious,
  onNext,
  isFavorite,
  onToggleFavorite,
  modelAction,
}: CharacterIllustrationPanelProps) {
  const { accent } = useGradientAccent();
  const isMobile = useIsMobile();
  const navIconSize = isMobile ? 'lg' : 'sm';
  const activeIllustrationName = activeIllustration?.name;

  if (loading) {
    return (
      <LoadingRegion label="Loading character illustrations">
        <StaticSurface p="md" radius="lg">
          <Stack gap="xs">
            <Skeleton height={18} width="35%" />
            <Skeleton height={ILLUSTRATION_PANEL.HEIGHT} radius="md" />
          </Stack>
        </StaticSurface>
      </LoadingRegion>
    );
  }

  if (!activeIllustration || illustrationsLength === 0) {
    return (
      <StaticSurface p="xl" radius="lg">
        <Center h={ILLUSTRATION_PANEL.HEIGHT}>
          <Text c="dimmed">No illustrations available</Text>
        </Center>
      </StaticSurface>
    );
  }

  return (
    <StaticSurface
      p={{ base: 'sm', sm: 'md' }}
      radius="lg"
      style={{ overflow: 'hidden' }}
    >
      <Stack gap="xs">
        {skinOptions.length > 1 && (
          <Select
            label="Skin"
            data={skinOptions}
            value={selectedSkinSlug}
            onChange={onSkinChange}
            allowDeselect={false}
            size="xs"
          />
        )}
        <Group justify="space-between" align="center">
          <Title order={2} size="h4">
            Illustrations
          </Title>
          <Group gap="xs" wrap="nowrap">
            {modelAction}
            {activeIllustrationIndex >= 0 &&
              (hasMultipleIllustrations ? (
                <Group gap={2} align="center">
                  <ActionIcon
                    onClick={onPrevious}
                    variant="subtle"
                    color={accent.primary}
                    size={navIconSize}
                    aria-label="Previous illustration"
                  >
                    <IoChevronBack />
                  </ActionIcon>
                  <Text size="xs" c="dimmed">
                    {activeIllustrationIndex + 1}/{illustrationsLength}
                  </Text>
                  <ActionIcon
                    onClick={onNext}
                    variant="subtle"
                    color={accent.primary}
                    size={navIconSize}
                    aria-label="Next illustration"
                  >
                    <IoChevronForward />
                  </ActionIcon>
                </Group>
              ) : (
                <Text size="xs" c="dimmed">
                  {activeIllustrationIndex + 1}/{illustrationsLength}
                </Text>
              ))}
          </Group>
        </Group>
        <Box style={{ position: 'relative' }}>
          <UnstyledButton
            onClick={onOpenPreview}
            style={{
              display: 'block',
              width: '100%',
              minHeight: NAV_ITEM_HEIGHT,
              borderRadius: 'var(--mantine-radius-md)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {activeIllustration.type === 'video' ? (
              <SafeVideo
                src={activeIllustration.src}
                autoPlay
                muted
                loop={activeIllustration.videoVariant !== 'birth'}
                style={{
                  width: '100%',
                  maxHeight: ILLUSTRATION_PANEL.HEIGHT,
                  display: 'block',
                }}
              />
            ) : (
              <SafeImage
                src={activeIllustration.src}
                alt={`${characterName} - ${activeIllustration.name}`}
                fit="contain"
                mah={ILLUSTRATION_PANEL.HEIGHT}
                loading="lazy"
              />
            )}
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, transparent var(--dt-gradient-overlay-mid), rgba(0,0,0,0.55) 100%)',
                pointerEvents: 'none',
              }}
            />
            <Group
              justify="space-between"
              align="center"
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: 12,
              }}
            >
              <Stack gap={2}>
                <Text size="sm" fw={600} c="white">
                  {activeIllustrationName ?? characterName}
                </Text>
                <Text size="xs" c="gray.2">
                  {activeIllustration.type === 'video'
                    ? 'Animation'
                    : 'Artwork'}
                </Text>
              </Stack>
              <Badge
                leftSection={<IoExpand />}
                variant="light"
                color={accent.primary}
                size="md"
              >
                View
              </Badge>
            </Group>
          </UnstyledButton>
          {onToggleFavorite && (
            <ActionIcon
              onClick={onToggleFavorite}
              variant="filled"
              color="dark"
              radius="xl"
              size="sm"
              aria-label={
                isFavorite ? 'Remove from favorites' : 'Add to favorites'
              }
              style={{ position: 'absolute', top: 8, right: 8, opacity: 0.85 }}
            >
              {isFavorite ? (
                <IoStar color="gold" />
              ) : (
                <IoStarOutline color="white" />
              )}
            </ActionIcon>
          )}
        </Box>
      </Stack>
    </StaticSurface>
  );
}
