import {
  Anchor,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { useCallback, useState } from 'react';
import { IoFlagOutline, IoThumbsUpOutline } from 'react-icons/io5';
import { Link } from 'react-router';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { useGradientAccent } from '@/hooks';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { deleteCommunityItem, reportCommunityItem, setUpvote } from './api';
import { useCommunityAuth } from './auth-context';
import type { CommunityMeta } from './types';
import TurnstileWidget from './TurnstileWidget';

export default function CommunityActions({
  community,
  onEdit,
  onDeleted,
}: {
  community: CommunityMeta;
  onEdit?: () => void;
  onDeleted?: () => void;
}) {
  const { user, csrfToken, login } = useCommunityAuth();
  const { accent } = useGradientAccent();
  const [score, setScore] = useState(community.score);
  const [upvoted, setUpvoted] = useState(community.viewerHasUpvoted);
  const [working, setWorking] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string | null>('broken');
  const [note, setNote] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [challengeVersion, setChallengeVersion] = useState(0);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const handleToken = useCallback(
    (token: string | null) => setTurnstileToken(token),
    [],
  );

  const vote = async () => {
    if (!user) {
      login('discord');
      return;
    }
    if (!csrfToken || community.viewerOwns) return;
    setWorking(true);
    try {
      const result = await setUpvote(
        community.kind,
        community.id,
        !upvoted,
        csrfToken,
      );
      setScore(result.score);
      setUpvoted(result.viewerHasUpvoted);
    } catch (error) {
      showErrorToast({
        title: 'Could not update vote',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setWorking(false);
    }
  };

  const report = async () => {
    if (!csrfToken || !reason || !turnstileToken) return;
    setWorking(true);
    try {
      await reportCommunityItem(
        community.kind,
        community.id,
        reason,
        note,
        csrfToken,
        turnstileToken,
      );
      showSuccessToast({
        title: 'Report received',
        message: 'A moderator can now review this publication.',
      });
      setReportOpen(false);
      setTurnstileToken(null);
      setChallengeVersion((value) => value + 1);
    } catch (error) {
      showErrorToast({
        title: 'Could not submit report',
        message: error instanceof Error ? error.message : String(error),
      });
      setTurnstileToken(null);
      setChallengeVersion((value) => value + 1);
    } finally {
      setWorking(false);
    }
  };

  const closeReport = () => {
    setReportOpen(false);
    setTurnstileToken(null);
    setChallengeVersion((value) => value + 1);
  };

  const remove = async () => {
    if (!csrfToken) return;
    setConfirmDeleteOpen(false);
    setWorking(true);
    try {
      await deleteCommunityItem(community.kind, community.id, csrfToken);
      showSuccessToast({
        title: 'Deleted',
        message: 'The publication is no longer public.',
      });
      onDeleted?.();
    } catch (error) {
      showErrorToast({
        title: 'Could not delete',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <Group gap={4} wrap="nowrap">
        <Button
          size="compact-xs"
          variant={upvoted ? 'filled' : 'subtle'}
          color={accent.primary}
          leftSection={<IoThumbsUpOutline size={12} />}
          loading={working}
          disabled={community.viewerOwns}
          onClick={(event) => {
            event.stopPropagation();
            void vote();
          }}
        >
          {score}
        </Button>
        {!community.viewerOwns && (
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            leftSection={<IoFlagOutline size={12} />}
            onClick={(event) => {
              event.stopPropagation();
              if (!user) login('discord');
              else setReportOpen(true);
            }}
          >
            Report
          </Button>
        )}
        {community.viewerOwns && onEdit && (
          <Button
            size="compact-xs"
            variant="subtle"
            color={accent.primary}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            Edit
          </Button>
        )}
        {community.viewerOwns && (
          <Button
            size="compact-xs"
            variant="subtle"
            color="red"
            loading={working}
            onClick={(event) => {
              event.stopPropagation();
              setConfirmDeleteOpen(true);
            }}
          >
            Delete
          </Button>
        )}
      </Group>
      {/* Modals portal out of the DOM but React events still bubble through the
          component tree, so without this a click or Enter/Space keypress inside
          them would trigger the enclosing card's navigate handler. */}
      <div
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <ConfirmActionModal
          opened={confirmDeleteOpen}
          onCancel={() => setConfirmDeleteOpen(false)}
          title="Delete this publication?"
          message="This can only be restored by a moderator."
          confirmLabel="Delete"
          confirmColor="red"
          onConfirm={() => void remove()}
        />
        <Modal
          opened={reportOpen}
          onClose={closeReport}
          title="Report publication"
          centered
        >
          <Stack>
            <Text size="sm" c="dimmed">
              See the{' '}
              <Anchor
                component={Link}
                to="/community-guidelines"
                target="_blank"
                size="sm"
              >
                Community Guidelines
              </Anchor>{' '}
              for what's reportable.
            </Text>
            <Select
              value={reason}
              onChange={setReason}
              data={[
                { value: 'spam', label: 'Spam' },
                { value: 'broken', label: 'Broken or invalid data' },
                { value: 'abusive', label: 'Abusive content' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Textarea
              label="Details"
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              maxLength={1000}
              autosize
              minRows={3}
            />
            <TurnstileWidget key={challengeVersion} onToken={handleToken} />
            <Group justify="flex-end">
              <Button
                variant="outline"
                color={accent.primary}
                onClick={closeReport}
              >
                Cancel
              </Button>
              <Button
                color={accent.primary}
                onClick={() => void report()}
                disabled={!turnstileToken || !reason}
                loading={working}
              >
                Submit report
              </Button>
            </Group>
          </Stack>
        </Modal>
      </div>
    </>
  );
}
