import {
  Alert,
  Anchor,
  Button,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useCallback, useState } from 'react';
import {
  IoInformationCircleOutline,
  IoLogoDiscord,
  IoLogoGithub,
} from 'react-icons/io5';
import { Link } from 'react-router';
import { useGradientAccent } from '@/hooks';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { publishCommunityItem, updateCommunityItem } from './api';
import { useCommunityAuth } from './auth-context';
import type { CommunityKind } from './types';
import TurnstileWidget from './TurnstileWidget';

interface PublishModalProps<T> {
  opened: boolean;
  onClose: () => void;
  kind: CommunityKind;
  payload: T;
  onPublished?: (id: string) => void;
  publicationId?: string;
}

export default function PublishModal<T>({
  opened,
  onClose,
  kind,
  payload,
  onPublished,
  publicationId,
}: PublishModalProps<T>) {
  const { user, configured, csrfToken, login } = useCommunityAuth();
  const { accent } = useGradientAccent();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [challengeVersion, setChallengeVersion] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const handleToken = useCallback(
    (token: string | null) => setTurnstileToken(token),
    [],
  );
  const close = () => {
    setTurnstileToken(null);
    setChallengeVersion((value) => value + 1);
    onClose();
  };

  const publish = async () => {
    if (!csrfToken || (!publicationId && !turnstileToken)) return;
    setPublishing(true);
    try {
      const result = publicationId
        ? (await updateCommunityItem(kind, publicationId, payload, csrfToken),
          { id: publicationId })
        : await publishCommunityItem(kind, payload, csrfToken, turnstileToken!);
      showSuccessToast({
        title: publicationId ? 'Updated' : 'Published',
        message: `Your ${kind === 'team' ? 'team' : 'tier list'} is now public.`,
      });
      close();
      onPublished?.(result.id);
    } catch (error) {
      showErrorToast({
        title: 'Could not publish',
        message: error instanceof Error ? error.message : String(error),
      });
      setTurnstileToken(null);
      setChallengeVersion((value) => value + 1);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title={`${publicationId ? 'Update' : 'Publish'} ${kind === 'team' ? 'team' : 'tier list'}`}
      centered
      size="md"
    >
      <Stack gap="lg">
        {!configured ? (
          <>
            <Alert
              color={accent.primary}
              variant="light"
              icon={<IoInformationCircleOutline />}
              title="Community publishing is unavailable"
            >
              Community services are not configured for this deployment. You can
              continue saving this {kind === 'team' ? 'team' : 'tier list'} as a
              local draft.
            </Alert>
            <Group justify="flex-end">
              <Button variant="outline" color={accent.primary} onClick={close}>
                Continue locally
              </Button>
            </Group>
          </>
        ) : !user ? (
          <>
            <Alert
              color={accent.primary}
              variant="light"
              icon={<IoInformationCircleOutline />}
            >
              Sign in to publish this publicly. Your local saved items remain in
              this browser.
            </Alert>
            <SimpleGrid cols={{ base: 1, xs: 2 }}>
              <Button
                color={accent.primary}
                leftSection={<IoLogoDiscord />}
                onClick={() => login('discord')}
              >
                Continue with Discord
              </Button>
              <Button
                variant="light"
                color={accent.secondary}
                leftSection={<IoLogoGithub />}
                onClick={() => login('github')}
              >
                Continue with GitHub
              </Button>
            </SimpleGrid>
          </>
        ) : (
          <>
            <Text size="sm">
              This will be {publicationId ? 'updated' : 'published immediately'}{' '}
              as <strong>{user.displayName}</strong>. You can edit or delete it
              later. Please follow the{' '}
              <Anchor
                component={Link}
                to="/community-guidelines"
                target="_blank"
              >
                Community Guidelines
              </Anchor>
              .
            </Text>
            {!publicationId && (
              <TurnstileWidget key={challengeVersion} onToken={handleToken} />
            )}
            <Group justify="flex-end">
              <Button variant="outline" color={accent.primary} onClick={close}>
                Cancel
              </Button>
              <Button
                color={accent.primary}
                onClick={publish}
                disabled={!publicationId && !turnstileToken}
                loading={publishing}
              >
                {publicationId ? 'Update' : 'Publish'}
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
