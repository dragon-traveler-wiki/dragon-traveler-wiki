import {
  ActionIcon,
  CopyButton,
  Group,
  Skeleton,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { IoCheckmark, IoCopyOutline } from 'react-icons/io5';
import ResourceBadge from '@/components/ui/ResourceBadge';
import { StaticSurface } from '@/components/ui/Surface';
import { LoadingRegion } from '@/components/layout/PageLoadingSkeleton';
import { useCodes } from '@/features/wiki/hooks/use-wiki-data';
import { useGradientAccent, useMobileTooltip } from '@/hooks';
import { isCodeActive } from '@/utils';
import HomeSectionError from './HomeSectionError';

export default function ActiveCodesSection() {
  const tooltipProps = useMobileTooltip();
  const { accent } = useGradientAccent();
  const { data: codes, loading, error, retry } = useCodes();
  const activeCodes = codes.filter(isCodeActive).reverse().slice(0, 5);

  if (loading) {
    return (
      <LoadingRegion label="Loading active codes">
        <Stack gap="xs">
          {[1, 2, 3, 4, 5].map((i) => (
            <StaticSurface key={i} p="xs">
              <Group justify="space-between" wrap="nowrap">
                <Skeleton height={14} width={96} radius="sm" />
                <Skeleton height={26} width={26} radius="md" />
              </Group>
              <Group gap={4} mt="xs">
                <Skeleton height={18} width={54} radius="xl" />
                <Skeleton height={18} width={62} radius="xl" />
              </Group>
            </StaticSurface>
          ))}
        </Stack>
      </LoadingRegion>
    );
  }

  if (error) {
    return <HomeSectionError message="Could not load codes." onRetry={retry} />;
  }

  if (activeCodes.length === 0) {
    return (
      <Text size="sm" c="dimmed" fs="italic">
        No active codes at the moment.
      </Text>
    );
  }

  return (
    <Stack gap="xs">
      {activeCodes.map((entry) => (
        <StaticSurface key={entry.code} p="xs">
          <Group justify="space-between" wrap="nowrap">
            <Text ff="monospace" fw={500} size="sm" truncate>
              {entry.code}
            </Text>
            <CopyButton value={entry.code} timeout={1500}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy'} {...tooltipProps}>
                  <ActionIcon
                    variant="subtle"
                    color={copied ? accent.primary : 'gray'}
                    size="sm"
                    onClick={copy}
                    aria-label={copied ? 'Copied!' : 'Copy code'}
                  >
                    {copied ? (
                      <IoCheckmark size={14} />
                    ) : (
                      <IoCopyOutline size={14} />
                    )}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          {Object.keys(entry.rewards ?? {}).length > 0 && (
            <Group gap={4} mt="xs" wrap="wrap">
              {Object.entries(entry.rewards ?? {}).map(([slug, qty]) => (
                <ResourceBadge
                  key={slug}
                  slug={slug}
                  quantity={qty}
                  size="xs"
                />
              ))}
            </Group>
          )}
        </StaticSurface>
      ))}
    </Stack>
  );
}
