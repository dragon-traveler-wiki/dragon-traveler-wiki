import {
  ActionIcon,
  Box,
  Container,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useState } from 'react';
import { IoClose } from 'react-icons/io5';
import SafeImage from '@/components/ui/SafeImage';
import { BREAKPOINTS, PAGE_WIDTH } from '@/constants/ui';
import { useGradientAccent } from '@/hooks';

interface CharacterFullBodyArtworkProps {
  src: string;
  characterName: string;
  dimmed?: boolean;
}

/**
 * Smoothly scale differently shaped canvases without breakpoint-like jumps.
 * The bounded curve keeps unusually tall and wide source images within a
 * useful visual range while giving narrow character art more presence.
 */
function getArtworkHeight(aspectRatio: number): number {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) return 140;
  return 90 + 140 / (1 + Math.pow(aspectRatio / 0.75, 2));
}

export default function CharacterFullBodyArtwork({
  src,
  characterName,
  dimmed = false,
}: CharacterFullBodyArtworkProps) {
  const isWideEnough = useMediaQuery(BREAKPOINTS.MD);
  const { accent } = useGradientAccent();
  const [opened, setOpened] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [measurement, setMeasurement] = useState<{
    src: string;
    height: number;
  } | null>(null);
  const height =
    measurement && measurement.src === src ? measurement.height : null;

  if (!isWideEnough) return null;

  return (
    <>
      <Container
        size={PAGE_WIDTH.WIDE}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <Box
          style={{
            position: 'absolute',
            right: 'clamp(16px, 2vw, 32px)',
            bottom: 0,
            width: '40%',
            height: 'calc(100% - 32px)',
            maskImage:
              'linear-gradient(to right, transparent 0%, black 24%, black 76%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 24%, black 76%, transparent 100%)',
          }}
        >
          <SafeImage
            src={src}
            alt=""
            loading="eager"
            onLoad={(event) => {
              const image = event.currentTarget;
              setMeasurement({
                src,
                height: getArtworkHeight(
                  image.naturalWidth / image.naturalHeight,
                ),
              });
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              width: 'auto',
              maxWidth: 'none',
              height: `${height ?? 140}%`,
              opacity: height == null ? 0 : dimmed ? 0.35 : 1,
              transform: hovered
                ? 'translateX(-50%) scale(1.02)'
                : 'translateX(-50%) scale(1)',
              transformOrigin: 'center top',
              filter: [
                dimmed ? 'grayscale(1)' : null,
                hovered ? 'brightness(1.08)' : null,
              ]
                .filter(Boolean)
                .join(' '),
              transition:
                'opacity 160ms ease, transform 180ms ease, filter 180ms ease',
              pointerEvents: 'none',
              maskImage:
                'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, black 0%, black 72%, transparent 100%)',
            }}
          />
        </Box>
        <UnstyledButton
          aria-label={`View full-body artwork for ${characterName}`}
          onClick={() => setOpened(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          style={{
            position: 'absolute',
            zIndex: 2,
            right: 'clamp(16px, 2vw, 32px)',
            bottom: 0,
            width: '40%',
            height: 'calc(100% - 32px)',
            pointerEvents: 'auto',
            cursor: 'zoom-in',
          }}
        />
      </Container>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        size="95%"
        centered
        withCloseButton={false}
        lockScroll={false}
      >
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text fw={600} size="lg">
              {characterName} — Full-body artwork
            </Text>
            <ActionIcon
              onClick={() => setOpened(false)}
              aria-label="Close"
              variant="default"
              color={accent.primary}
              radius="xl"
            >
              <IoClose />
            </ActionIcon>
          </Group>

          <Paper
            withBorder
            radius="lg"
            p={0}
            style={{
              maxHeight: '70vh',
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <SafeImage
              src={src}
              alt={`${characterName} full-body artwork`}
              fit="contain"
              mah="70vh"
              radius="lg"
              loading="lazy"
            />
          </Paper>
        </Stack>
      </Modal>
    </>
  );
}
