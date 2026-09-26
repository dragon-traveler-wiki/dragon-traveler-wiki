import { ActionIcon, Tooltip } from '@mantine/core';
import { useContext, useState } from 'react';
import { MdOutlinePushPin, MdPushPin } from 'react-icons/md';
import { TierListReferenceContext } from '@/contexts';
import { setReferenceTierList } from '@/features/community/api';
import { useCommunityAuth } from '@/features/community/auth-context';
import { runAction } from '@/features/community/run-action';
import type { TierList } from '@/features/tier-list/types';
import { getTierListEntityType } from '@/features/tier-list/types';

/**
 * Moderator-only control that marks a published character tier list as the
 * site-wide default "Tier List Reference" (used for tier badges on characters
 * and the home page). Viewers can still pick their own in Settings.
 */
export default function ReferenceTierListToggle({
  tierList,
}: {
  tierList: TierList;
}) {
  const { user, csrfToken } = useCommunityAuth();
  const { siteReferenceId, refreshSiteReference } = useContext(
    TierListReferenceContext,
  );
  const [working, setWorking] = useState(false);
  const id = tierList.community?.id;

  if (
    user?.role !== 'moderator' ||
    !csrfToken ||
    !id ||
    getTierListEntityType(tierList) !== 'character' ||
    tierList.community?.status !== 'published'
  ) {
    return null;
  }

  const isReference = siteReferenceId === id;
  const toggle = async () => {
    setWorking(true);
    const result = await runAction(
      () => setReferenceTierList(isReference ? null : id, csrfToken),
      {
        errorTitle: 'Could not update reference',
        success: {
          title: isReference ? 'Reference removed' : 'Reference set',
          message: isReference
            ? 'There is no site default tier list now.'
            : 'This is now the default tier list reference.',
        },
      },
    );
    if (result.ok) refreshSiteReference();
    setWorking(false);
  };

  const label = isReference
    ? 'Remove as site reference'
    : 'Set as site reference';
  return (
    <Tooltip label={label} withArrow>
      <ActionIcon
        variant="subtle"
        color={isReference ? 'grape' : 'gray'}
        size="sm"
        loading={working}
        aria-label={label}
        onClick={() => void toggle()}
      >
        {isReference ? <MdPushPin size={16} /> : <MdOutlinePushPin size={16} />}
      </ActionIcon>
    </Tooltip>
  );
}
