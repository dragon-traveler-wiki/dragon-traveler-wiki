import { Button } from '@mantine/core';
import { useContext, useState } from 'react';
import { IoPin, IoPinOutline } from 'react-icons/io5';
import { TierListReferenceContext } from '@/contexts';
import { setReferenceTierList } from '@/features/community/api';
import { useCommunityAuth } from '@/features/community/auth-context';
import type { TierList } from '@/features/tier-list/types';
import { getTierListEntityType } from '@/features/tier-list/types';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

/**
 * Moderator-only control that pins a published character tier list as the
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
    try {
      await setReferenceTierList(isReference ? null : id, csrfToken);
      refreshSiteReference();
      showSuccessToast({
        title: isReference ? 'Reference removed' : 'Reference set',
        message: isReference
          ? 'There is no site default tier list now.'
          : 'This is now the default tier list reference.',
      });
    } catch (error) {
      showErrorToast({
        title: 'Could not update reference',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Button
      variant={isReference ? 'filled' : 'light'}
      color="grape"
      loading={working}
      leftSection={
        isReference ? <IoPin size={14} /> : <IoPinOutline size={14} />
      }
      onClick={() => void toggle()}
    >
      {isReference ? 'Site reference' : 'Set as site reference'}
    </Button>
  );
}
