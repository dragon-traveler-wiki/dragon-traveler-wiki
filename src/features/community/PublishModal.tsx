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
import { publishCommunityItem, updateCommunityItem } from './api';
import { useCommunityAuth } from './auth-context';
import type { CommunityKind } from './types';
import { runAction } from './run-action';
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
  const [conflict, setConflict] = useState(false);
  const handleToken = useCallback(
    (token: string | null) => setTurnstileToken(token),
    [],
  );
  const close = () => {
    setTurnstileToken(null);
    setChallengeVersion((value) => value + 1);
    setConflict(false);
    onClose();
  };

  const publish = async () => {
    if (!csrfToken || (!publicationId && !turnstileToken)) return;
    setPublishing(true);
    setConflict(false);
    const result = await runAction(
      async () => {
        if (!publicationId) {
          return publishCommunityItem(
            kind,
            payload,
            csrfToken,
            turnstileToken!,
          );
        }
        await updateCommunityItem(kind, publicationId, payload, csrfToken);
        return { id: publicationId };
      },
      {
        errorTitle: 'Could not publish',
        success: {
          title: publicationId ? 'Updated' : 'Published',
          message: `Your ${kind === 'team' ? 'team' : 'tier list'} is now public.`,
        },
      },
    );
    if (result.ok) {
      close();
      onPublished?.(result.value.id);
    } else {
      // A Turnstile token is single-use, so always ask for a fresh one.
      setTurnstileToken(null);
      setChallengeVersion((value) => value + 1);
      if (result.status === 409) setConflict(true);
    }
    setPublishing(false);
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
            {conflict && (
              <Alert
                color="red"
                variant="light"
                icon={<IoInformationCircleOutline />}
                title="Someone else changed this first"
              >
                <Stack gap="sm">
                  <Text size="sm">
                    Reload the page to get the latest version before trying
                    again, or you&apos;ll keep overwriting each other&apos;s
                    changes.
                  </Text>
                  <Group justify="flex-end">
                    <Button
                      size="xs"
                      color="red"
                      variant="light"
                      onClick={() => window.location.reload()}
                    >
                      Reload page
                    </Button>
                  </Group>
                </Stack>
              </Alert>
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
