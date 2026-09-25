import {
  Button,
  Checkbox,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { useState } from 'react';
import { useGradientAccent } from '@/hooks';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { suspendUser } from './api';
import { useCommunityAuth } from './auth-context';
import type { SuspensionDuration } from './types';

const DURATION_OPTIONS: Array<{ value: SuspensionDuration; label: string }> = [
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'permanent', label: 'Permanent ban' },
];

interface SuspendUserModalProps {
  opened: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
  onSuspended?: () => void;
}

/** Moderator dialog for timing out or banning a user. */
export default function SuspendUserModal({
  opened,
  userId,
  userName,
  onClose,
  onSuspended,
}: SuspendUserModalProps) {
  const { csrfToken } = useCommunityAuth();
  const { accent } = useGradientAccent();
  const [duration, setDuration] = useState<SuspensionDuration>('7d');
  const [reason, setReason] = useState('');
  const [hideContent, setHideContent] = useState(false);
  const [working, setWorking] = useState(false);

  const submit = async () => {
    if (!csrfToken) return;
    setWorking(true);
    try {
      await suspendUser(userId, { duration, reason, hideContent }, csrfToken);
      showSuccessToast({
        title: duration === 'permanent' ? 'User banned' : 'User suspended',
        message: `${userName} can no longer publish, edit, vote, or report${
          duration === 'permanent' ? '' : ' until the suspension ends'
        }.`,
      });
      setReason('');
      setHideContent(false);
      onClose();
      onSuspended?.();
    } catch (error) {
      showErrorToast({
        title: 'Could not suspend user',
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Suspend ${userName}`}
      centered
      lockScroll={false}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          They can still browse and delete their own content, but can't publish,
          edit, vote, or report. They also can't delete their account or unlink
          sign-ins while suspended.
        </Text>
        <Select
          label="Length"
          value={duration}
          onChange={(value) =>
            value && setDuration(value as SuspensionDuration)
          }
          data={DURATION_OPTIONS}
          allowDeselect={false}
        />
        <Textarea
          label="Reason"
          description="Shown to the user."
          value={reason}
          onChange={(event) => setReason(event.currentTarget.value)}
          maxLength={500}
          autosize
          minRows={2}
        />
        <Checkbox
          label="Also hide all of their published items"
          checked={hideContent}
          onChange={(event) => setHideContent(event.currentTarget.checked)}
        />
        <Group justify="flex-end">
          <Button variant="outline" color={accent.primary} onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" loading={working} onClick={() => void submit()}>
            {duration === 'permanent' ? 'Ban user' : 'Suspend user'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
