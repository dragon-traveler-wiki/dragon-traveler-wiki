import {
  Badge,
  Collapse,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import {
  IoChevronDown,
  IoChevronUp,
  IoGift,
  IoStatsChart,
  IoTrophy,
} from 'react-icons/io5';
import ResourceBadge from '@/components/ui/ResourceBadge';
import { StaticSurface } from '@/components/ui/Surface';
import type { CodeTab, CodeView } from '@/features/wiki/codes/code-catalog';

interface RewardGroupProps {
  title: string;
  emptyMessage: string;
  rewards: Map<string, number>;
  color: 'yellow' | 'teal';
  icon: React.ReactNode;
}

function RewardGroup({
  title,
  emptyMessage,
  rewards,
  color,
  icon,
}: RewardGroupProps) {
  return (
    <Stack gap="xs" style={{ flex: '1 1 220px' }}>
      <Group gap="xs">
        <ThemeIcon variant="light" color={color} size="sm" radius="sm">
          {icon}
        </ThemeIcon>
        <Text size="sm" fw={600}>
          {title}
        </Text>
        {rewards.size > 0 ? (
          <Badge variant="light" color={color} size="xs">
            {rewards.size} types
          </Badge>
        ) : null}
      </Group>
      {rewards.size > 0 ? (
        <Group gap="xs" wrap="wrap">
          {[...rewards.entries()].map(([slug, quantity]) => (
            <ResourceBadge key={slug} slug={slug} quantity={quantity} />
          ))}
        </Group>
      ) : (
        <Text size="sm" c="dimmed" fs="italic">
          {emptyMessage}
        </Text>
      )}
    </Stack>
  );
}

export default function CodeRewardSummary({
  tab,
  view,
  opened,
  onToggle,
  unclaimedRewards,
  claimedRewards,
  accentColor,
}: {
  tab: CodeTab;
  view: CodeView;
  opened: boolean;
  onToggle: () => void;
  unclaimedRewards: Map<string, number>;
  claimedRewards: Map<string, number>;
  accentColor: string;
}) {
  return (
    <StaticSurface p="sm">
      <UnstyledButton
        onClick={onToggle}
        aria-expanded={opened}
        aria-controls="code-reward-summary"
        style={{ width: '100%', borderRadius: 'var(--mantine-radius-sm)' }}
      >
        <Group justify="space-between" align="center" px="xs" py={4}>
          <Group gap="sm">
            <ThemeIcon
              variant="light"
              color={accentColor}
              size="md"
              radius="md"
            >
              <IoStatsChart size={14} />
            </ThemeIcon>
            <Text fw={600} size="sm">
              Reward Summary ({tab === 'active' ? 'Active' : 'Expired'} ·{' '}
              {view === 'unredeemed'
                ? 'Unredeemed'
                : view === 'redeemed'
                  ? 'Redeemed'
                  : 'All'}
              )
            </Text>
          </Group>
          {opened ? <IoChevronUp size={16} /> : <IoChevronDown size={16} />}
        </Group>
      </UnstyledButton>
      <Collapse id="code-reward-summary" expanded={opened}>
        <Divider mt="sm" mb="md" />
        <Group align="flex-start" gap={0} wrap="wrap">
          {view !== 'redeemed' ? (
            <RewardGroup
              title={tab === 'active' ? 'Unclaimed' : 'Unredeemed'}
              emptyMessage={
                tab === 'active'
                  ? 'Nothing left to claim!'
                  : 'No unredeemed expired rewards.'
              }
              rewards={unclaimedRewards}
              color="yellow"
              icon={<IoGift size={12} />}
            />
          ) : null}
          {view === 'all' ? (
            <>
              <Divider
                orientation="vertical"
                mx="lg"
                visibleFrom="sm"
                style={{ alignSelf: 'stretch' }}
              />
              <Divider hiddenFrom="sm" w="100%" my="sm" />
            </>
          ) : null}
          {view !== 'unredeemed' ? (
            <RewardGroup
              title="Claimed"
              emptyMessage={
                tab === 'active'
                  ? 'No active codes redeemed yet.'
                  : 'No expired codes redeemed yet.'
              }
              rewards={claimedRewards}
              color="teal"
              icon={<IoTrophy size={12} />}
            />
          ) : null}
        </Group>
      </Collapse>
    </StaticSurface>
  );
}
