import SafeImage from '@/components/ui/SafeImage';
import SafeVideo from '@/components/ui/SafeVideo';
import { StaticSurface } from '@/components/ui/Surface';
import { BREAKPOINTS, ILLUSTRATION_PANEL } from '@/constants/ui';
import { Badge, Box, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useState } from 'react';
import { IoExpand } from 'react-icons/io5';

interface IllustrationPreviewCardProps {
  src: string;
  name: string;
  type?: 'image' | 'video';
  subtitle?: string;
  label?: string;
  accentColor: string;
  onExpand: () => void;
}

export default function IllustrationPreviewCard({
  src,
  name,
  type = 'image',
  subtitle = 'Artwork',
  label = 'Illustration',
  accentColor,
  onExpand,
}: IllustrationPreviewCardProps) {
  const isDesktop = useMediaQuery(BREAKPOINTS.DESKTOP);
  const [failed, setFailed] = useState(false);
  const [trackedSrc, setTrackedSrc] = useState(src);
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setFailed(false);
  }

  if (failed) return null;

  return (
    <StaticSurface p="md" radius="lg" style={{ overflow: 'hidden' }}>
      <Stack gap="xs">
        <Text fw={600} size="sm">
          {label}
        </Text>
        <UnstyledButton
          onClick={onExpand}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: ILLUSTRATION_PANEL.HEIGHT,
            borderRadius: 'var(--mantine-radius-md)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {type === 'video' ? (
            <SafeVideo
              src={src}
              autoPlay
              muted
              loop
              onError={() => setFailed(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <SafeImage
              src={src}
              alt={name}
              fit="contain"
              w="100%"
              h={ILLUSTRATION_PANEL.HEIGHT}
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
            style={{ position: 'absolute', bottom: 12, left: 12, right: 12 }}
          >
            <Stack gap={2}>
              <Text size="sm" fw={600} c="white">
                {name}
              </Text>
              <Text size="xs" c="gray.2">
                {subtitle}
              </Text>
            </Stack>
            <Badge
              leftSection={<IoExpand />}
              variant="light"
              color={accentColor}
              size={isDesktop ? 'md' : 'lg'}
            >
              View
            </Badge>
          </Group>
        </UnstyledButton>
      </Stack>
    </StaticSurface>
  );
}
