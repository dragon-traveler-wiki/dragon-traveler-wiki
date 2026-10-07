import {
  ActionIcon,
  Badge,
  Box,
  Center,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core';
import SafeImage from '@/components/ui/SafeImage';
import SafeVideo from '@/components/ui/SafeVideo';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  IoChevronBack,
  IoChevronForward,
  IoClose,
  IoContract,
  IoExpand,
  IoFilm,
  IoStar,
  IoStarOutline,
} from 'react-icons/io5';
import type { Illustration } from '@/assets';
import { StaticSurface } from '@/components/ui/Surface';
import { TRANSITION } from '@/constants/ui';
import { useGradientAccent } from '@/hooks';

type TooltipInteractionProps = {
  openDelay: number;
  closeDelay: number;
  withArrow: boolean;
  position: 'top';
  events?: {
    hover: boolean;
    focus: boolean;
    touch: boolean;
  };
};

type NavDirection = 'previous' | 'next';

interface IllustrationPreviewModalProps {
  opened: boolean;
  onClose: () => void;
  entityName: string;
  illustrations: Illustration[];
  activeIllustrationIndex?: number;
  /** Omit for single-media previews; navigation controls are hidden without it. */
  onSelectIllustration?: (illustration: Illustration) => void;
  tooltipProps: TooltipInteractionProps;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function IllustrationPreviewModal({
  opened,
  onClose,
  entityName,
  illustrations,
  activeIllustrationIndex = 0,
  onSelectIllustration,
  tooltipProps,
  isFavorite,
  onToggleFavorite,
}: IllustrationPreviewModalProps) {
  const { accent } = useGradientAccent();
  const mediaContainerRef = useRef<HTMLElement>(null);
  const thumbnailListRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<NavDirection | null>(null);
  const thumbnailHintId = useId();

  const activeIllustration = illustrations[activeIllustrationIndex] ?? null;
  const canNavigate = Boolean(onSelectIllustration) && illustrations.length > 1;
  const lastIndex = illustrations.length - 1;
  const previousIndex =
    activeIllustrationIndex <= 0 ? lastIndex : activeIllustrationIndex - 1;
  const nextIndex =
    activeIllustrationIndex >= lastIndex ? 0 : activeIllustrationIndex + 1;

  const selectIllustrationByIndex = useCallback(
    (index: number) => {
      const candidate = illustrations[index];
      if (candidate) onSelectIllustration?.(candidate);
    },
    [illustrations, onSelectIllustration],
  );

  const handleFullscreen = useCallback(async () => {
    const el = mediaContainerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Element fullscreen is unavailable on some mobile browsers (e.g. iOS Safari).
      if (activeIllustration?.type === 'image' && activeIllustration.src) {
        window.open(activeIllustration.src, '_blank', 'noopener,noreferrer');
      }
    }
  }, [activeIllustration]);

  useEffect(() => {
    const handleFsChange = () =>
      setIsFullscreen(
        mediaContainerRef.current !== null &&
          document.fullscreenElement === mediaContainerRef.current,
      );
    document.addEventListener('fullscreenchange', handleFsChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (!opened || !canNavigate) return;
    const handleKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }
      const target = event.target as Node | null;
      // Leave arrow keys to a focused video so its native seeking still works.
      if (target instanceof HTMLMediaElement) return;
      const inThumbnails = Boolean(thumbnailListRef.current?.contains(target));

      let index: number;
      if (event.key === 'ArrowLeft') index = previousIndex;
      else if (event.key === 'ArrowRight') index = nextIndex;
      else if (event.key === 'Home' && inThumbnails) index = 0;
      else if (event.key === 'End' && inThumbnails) index = lastIndex;
      else return;

      event.preventDefault();
      selectIllustrationByIndex(index);
      if (inThumbnails) thumbnailRefs.current[index]?.focus();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    opened,
    canNavigate,
    previousIndex,
    nextIndex,
    lastIndex,
    selectIllustrationByIndex,
  ]);

  const renderNavButton = (direction: NavDirection) => {
    const isPrevious = direction === 'previous';
    const isHovered = hoveredNav === direction;
    return (
      <ActionIcon
        onClick={() =>
          selectIllustrationByIndex(isPrevious ? previousIndex : nextIndex)
        }
        onMouseEnter={() => setHoveredNav(direction)}
        onMouseLeave={() => setHoveredNav(null)}
        aria-label={isPrevious ? 'Previous illustration' : 'Next illustration'}
        variant="filled"
        color="dark"
        radius="xl"
        size="lg"
        style={{
          position: 'absolute',
          top: '50%',
          [isPrevious ? 'left' : 'right']: 16,
          opacity: isHovered ? 1 : 0.55,
          transform: `translateY(-50%) scale(${isHovered ? 1.1 : 1})`,
          transition: `opacity ${TRANSITION.FAST} ${TRANSITION.EASE}, transform ${TRANSITION.FAST} ${TRANSITION.EASE}`,
        }}
      >
        {isPrevious ? (
          <IoChevronBack size={24} />
        ) : (
          <IoChevronForward size={24} />
        )}
      </ActionIcon>
    );
  };

  const title = activeIllustration?.name ?? entityName;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="95%"
      centered
      withCloseButton={false}
      lockScroll={false}
    >
      {activeIllustration && (
        <Stack gap="md">
          <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
            {`Illustration ${activeIllustrationIndex + 1} of ${illustrations.length}: ${title}`}
          </VisuallyHidden>

          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="sm" align="center">
              <Text fw={600} size="lg">
                {title}
              </Text>
              {illustrations.length > 1 && (
                <Badge variant="light" color="gray">
                  {activeIllustrationIndex + 1}/{illustrations.length}
                </Badge>
              )}
            </Group>
            <Group gap="xs" wrap="nowrap">
              {onToggleFavorite && (
                <Tooltip
                  label={
                    isFavorite ? 'Remove from favorites' : 'Add to favorites'
                  }
                  {...tooltipProps}
                >
                  <ActionIcon
                    onClick={onToggleFavorite}
                    aria-label={
                      isFavorite ? 'Remove from favorites' : 'Add to favorites'
                    }
                    variant="default"
                    color={accent.primary}
                    radius="xl"
                  >
                    {isFavorite ? <IoStar color="gold" /> : <IoStarOutline />}
                  </ActionIcon>
                </Tooltip>
              )}
              {activeIllustration.type === 'image' && (
                <Tooltip
                  label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  {...tooltipProps}
                >
                  <ActionIcon
                    onClick={handleFullscreen}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    variant="default"
                    color={accent.primary}
                    radius="xl"
                  >
                    {isFullscreen ? <IoContract /> : <IoExpand />}
                  </ActionIcon>
                </Tooltip>
              )}
              <ActionIcon
                onClick={onClose}
                aria-label="Close"
                variant="default"
                color={accent.primary}
                radius="xl"
              >
                <IoClose />
              </ActionIcon>
            </Group>
          </Group>

          <StaticSurface
            ref={mediaContainerRef}
            radius="lg"
            p={0}
            style={{
              position: 'relative',
              maxHeight: isFullscreen ? '100dvh' : '70vh',
              overflow: 'hidden',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: isFullscreen ? 'black' : undefined,
              borderRadius: isFullscreen ? 0 : 'var(--mantine-radius-lg)',
            }}
          >
            {activeIllustration.type === 'video' ? (
              <SafeVideo
                src={activeIllustration.src}
                controls
                preload="auto"
                style={{
                  width: '100%',
                  maxHeight: isFullscreen ? '100dvh' : '70vh',
                  borderRadius: isFullscreen ? 0 : 'var(--mantine-radius-lg)',
                }}
              />
            ) : (
              <SafeImage
                src={activeIllustration.src}
                alt={`${entityName} - ${activeIllustration.name}`}
                fit="contain"
                mah={isFullscreen ? '100dvh' : '70vh'}
                radius={isFullscreen ? 0 : 'lg'}
              />
            )}

            {canNavigate && (
              <>
                {renderNavButton('previous')}
                {renderNavButton('next')}
              </>
            )}
          </StaticSurface>

          {canNavigate && (
            <>
              <VisuallyHidden id={thumbnailHintId}>
                Use Left and Right Arrow keys to move between thumbnails. Use
                Home for first and End for last illustration.
              </VisuallyHidden>
              <Box
                ref={thumbnailListRef}
                role="listbox"
                aria-label="Illustration thumbnails"
                aria-describedby={thumbnailHintId}
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'safe center',
                  overflowX: 'auto',
                  paddingBottom: 4,
                  paddingTop: 4,
                }}
              >
                {illustrations.map((illust, index) => {
                  const isActive = index === activeIllustrationIndex;
                  return (
                    <Stack
                      key={illust.src}
                      gap={4}
                      align="center"
                      style={{ flexShrink: 0 }}
                    >
                      <UnstyledButton
                        ref={(el) => {
                          thumbnailRefs.current[index] = el;
                        }}
                        onClick={() => selectIllustrationByIndex(index)}
                        role="option"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        aria-label={illust.name}
                        style={{
                          width: 96,
                          height: 60,
                          borderRadius: 'var(--mantine-radius-sm)',
                          overflow: 'hidden',
                          border: `2px solid ${
                            isActive
                              ? 'var(--mantine-primary-color-5)'
                              : 'var(--mantine-color-default-border)'
                          }`,
                          opacity: isActive ? 1 : 0.6,
                          transition: `opacity ${TRANSITION.FAST}, border-color ${TRANSITION.FAST}`,
                        }}
                      >
                        {illust.type === 'video' ? (
                          <Center
                            style={{
                              width: '100%',
                              height: '100%',
                              background: 'var(--mantine-color-dark-6)',
                            }}
                          >
                            <IoFilm size={22} color="white" />
                          </Center>
                        ) : (
                          <SafeImage
                            src={illust.src}
                            alt=""
                            w={96}
                            h={60}
                            fit="cover"
                            loading="lazy"
                          />
                        )}
                      </UnstyledButton>
                      <Text
                        size="xs"
                        c={isActive ? accent.primary : 'dimmed'}
                        fw={isActive ? 600 : 400}
                        ta="center"
                        lineClamp={1}
                        style={{ maxWidth: 96 }}
                        aria-hidden
                      >
                        {illust.name}
                      </Text>
                    </Stack>
                  );
                })}
              </Box>
            </>
          )}
        </Stack>
      )}
    </Modal>
  );
}
