import { Badge } from '@mantine/core';
import { useContext } from 'react';
import { IoPin } from 'react-icons/io5';
import { TierListReferenceContext } from '@/contexts';
import type { TierList } from '@/features/tier-list/types';

/** Marks the moderator-pinned tier list that drives the site's default tier badges. */
export default function ReferenceTierListBadge({
  tierList,
}: {
  tierList: TierList;
}) {
  const { siteReferenceId } = useContext(TierListReferenceContext);
  if (!siteReferenceId || tierList.community?.id !== siteReferenceId) {
    return null;
  }
  return (
    <Badge
      variant="light"
      color="grape"
      size="sm"
      leftSection={<IoPin size={10} />}
    >
      Site reference
    </Badge>
  );
}
