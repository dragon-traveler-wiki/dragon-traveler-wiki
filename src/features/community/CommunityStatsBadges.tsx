import { Badge, Group } from '@mantine/core';
import { useGradientAccent } from '@/hooks';
import type { CommunityStats } from './types';

/** Publication and upvote totals shown on both the public profile and account pages. */
export default function CommunityStatsBadges({
  stats,
}: {
  stats: CommunityStats;
}) {
  const { accent } = useGradientAccent();
  return (
    <Group gap="xs">
      <Badge variant="light" color={accent.primary}>
        {stats.teams} {stats.teams === 1 ? 'team' : 'teams'}
      </Badge>
      <Badge variant="light" color={accent.primary}>
        {stats.tierLists} {stats.tierLists === 1 ? 'tier list' : 'tier lists'}
      </Badge>
      <Badge variant="light" color={accent.secondary}>
        {stats.upvotes} {stats.upvotes === 1 ? 'upvote' : 'upvotes'} received
      </Badge>
    </Group>
  );
}
