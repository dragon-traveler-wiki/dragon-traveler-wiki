import {
  ActionIcon,
  Badge,
  Checkbox,
  CopyButton,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IoCheckmark,
  IoCloseCircleOutline,
  IoCopyOutline,
} from 'react-icons/io5';
import ResourceBadge from '@/components/ui/ResourceBadge';
import { StaticSurface } from '@/components/ui/Surface';
import { CODE_GRID_COLS, IMAGE_SIZE } from '@/constants/ui';
import type { ViewMode } from '@/hooks';
import type { Code } from '@/features/wiki/codes/types';
import { buildExpiredCodeUrl, isCodeActive } from '@/utils';

interface CodeCollectionProps {
  codes: Code[];
  viewMode: ViewMode;
  redeemed: Set<string>;
  onToggleRedeemed: (code: string) => void;
  accentColor: string;
  tooltipProps: Record<string, unknown>;
}

function CodeActions({
  entry,
  compact = false,
  tooltipProps,
}: {
  entry: Code;
  compact?: boolean;
  tooltipProps: Record<string, unknown>;
}) {
  const active = isCodeActive(entry);
  const iconSize = compact ? 16 : IMAGE_SIZE.ICON_LG;
  return (
    <Group gap={compact ? 4 : 'xs'} wrap="wrap">
      {active ? (
        <Tooltip label="Report expired" {...tooltipProps}>
          <ActionIcon
            component="a"
            href={buildExpiredCodeUrl(entry.code)}
            target="_blank"
            rel="noopener noreferrer"
            variant="subtle"
            color="red"
            size={compact ? 'sm' : undefined}
            aria-label="Report expired"
          >
            <IoCloseCircleOutline size={iconSize} />
          </ActionIcon>
        </Tooltip>
      ) : null}
      <CopyButton value={entry.code} timeout={1500}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied!' : 'Copy code'} {...tooltipProps}>
            <ActionIcon
              variant="subtle"
              color={copied ? 'teal' : 'gray'}
              onClick={copy}
              size={compact ? 'sm' : undefined}
              aria-label={copied ? 'Copied!' : 'Copy code'}
            >
              {copied ? (
                <IoCheckmark size={iconSize} />
              ) : (
                <IoCopyOutline size={iconSize} />
              )}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
}

function CodeRewards({ entry }: { entry: Code }) {
  const rewards = Object.entries(entry.rewards ?? {});
  if (rewards.length === 0) return null;
  return (
    <Group gap="xs" wrap="wrap">
      {rewards.map(([slug, quantity]) => (
        <ResourceBadge key={slug} slug={slug} quantity={quantity} />
      ))}
    </Group>
  );
}

export default function CodeCollection({
  codes,
  viewMode,
  redeemed,
  onToggleRedeemed,
  accentColor,
  tooltipProps,
}: CodeCollectionProps) {
  if (viewMode === 'grid') {
    return (
      <SimpleGrid cols={CODE_GRID_COLS} spacing="md">
        {codes.map((entry) => {
          const active = isCodeActive(entry);
          return (
            <StaticSurface key={entry.code} p="md" opacity={active ? 1 : 0.5}>
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <Text
                      ff="monospace"
                      fw={500}
                      size="md"
                      td={active ? undefined : 'line-through'}
                    >
                      {entry.code}
                    </Text>
                    {!active ? (
                      <Badge color="red" variant="light" size="xs">
                        Expired
                      </Badge>
                    ) : null}
                  </Group>
                  <CodeActions
                    entry={entry}
                    compact
                    tooltipProps={tooltipProps}
                  />
                </Group>
                <CodeRewards entry={entry} />
                <Checkbox
                  checked={redeemed.has(entry.code)}
                  onChange={() => onToggleRedeemed(entry.code)}
                  color={accentColor}
                  label="Redeemed"
                  styles={{ label: { paddingLeft: 8 } }}
                />
              </Stack>
            </StaticSurface>
          );
        })}
      </SimpleGrid>
    );
  }

  return (
    <Stack gap="md">
      {codes.map((entry) => {
        const active = isCodeActive(entry);
        return (
          <StaticSurface key={entry.code} p="sm" opacity={active ? 1 : 0.5}>
            <Group justify="space-between" wrap="wrap" align="center">
              <Group gap="sm" wrap="wrap" style={{ flex: 1, minWidth: 200 }}>
                <Text
                  ff="monospace"
                  fw={500}
                  size="lg"
                  td={active ? undefined : 'line-through'}
                >
                  {entry.code}
                </Text>
                {!active ? (
                  <Badge color="red" variant="light" size="sm">
                    Expired
                  </Badge>
                ) : null}
              </Group>
              <Group gap="xs" wrap="wrap">
                <CodeActions entry={entry} tooltipProps={tooltipProps} />
                <Checkbox
                  checked={redeemed.has(entry.code)}
                  onChange={() => onToggleRedeemed(entry.code)}
                  color={accentColor}
                  label="Redeemed"
                  styles={{ label: { paddingLeft: 8 } }}
                />
              </Group>
            </Group>
            <Group mt="xs">
              <CodeRewards entry={entry} />
            </Group>
          </StaticSurface>
        );
      })}
    </Stack>
  );
}
