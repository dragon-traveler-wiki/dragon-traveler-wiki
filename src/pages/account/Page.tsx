import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import {
  IoInformationCircleOutline,
  IoLogoDiscord,
  IoLogoGithub,
  IoPersonOutline,
} from 'react-icons/io5';
import { Link, useSearchParams } from 'react-router';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { getMyItems } from '@/features/community/api';
import { useCommunityAuth } from '@/features/community/auth-context';
import type { CommunityItem } from '@/features/community/types';
import { useGradientAccent } from '@/hooks';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  link_conflict:
    "That account is already linked to a different profile. Log in with the other provider first — if that profile is one you no longer want, you can delete it from its account page to free up the identity.",
  unknown: 'Something went wrong while signing in. Please try again.',
};

export default function AccountPage() {
  const {
    user,
    configured,
    loading,
    login,
    link,
    unlink,
    setPrimary,
    deleteAccount,
  } = useCommunityAuth();
  const { accent } = useGradientAccent();
  const [items, setItems] = useState<
    Array<CommunityItem<Record<string, unknown>>>
  >([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [unlinking, setUnlinking] = useState<'discord' | 'github' | null>(
    null,
  );
  const [settingPrimary, setSettingPrimary] = useState<
    'discord' | 'github' | null
  >(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteAccountOpen, setConfirmDeleteAccountOpen] =
    useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const authParamHandled = useRef(false);

  useEffect(() => {
    const auth = searchParams.get('auth');
    if (!auth || authParamHandled.current) return;
    authParamHandled.current = true;
    if (auth === 'error') {
      const reason = searchParams.get('reason') ?? 'unknown';
      showErrorToast({
        title: 'Sign-in failed',
        message: AUTH_ERROR_MESSAGES[reason] ?? AUTH_ERROR_MESSAGES.unknown,
      });
    } else if (auth === 'linked') {
      showSuccessToast({
        title: 'Identity linked',
        message: 'That account is now linked to your profile.',
      });
    } else if (auth === 'success') {
      showSuccessToast({ title: 'Signed in', message: 'Welcome back!' });
    }
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete('auth');
        next.delete('reason');
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnlink = (provider: 'discord' | 'github') => {
    setUnlinking(provider);
    unlink(provider)
      .catch((error: unknown) => {
        showErrorToast({
          title: 'Could not unlink identity',
          message: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => setUnlinking(null));
  };

  const handleSetPrimary = (provider: 'discord' | 'github') => {
    setSettingPrimary(provider);
    setPrimary(provider)
      .catch((error: unknown) => {
        showErrorToast({
          title: 'Could not set primary identity',
          message: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => setSettingPrimary(null));
  };

  const handleDeleteAccount = () => {
    setConfirmDeleteAccountOpen(false);
    setDeleting(true);
    deleteAccount()
      .then(() => {
        showSuccessToast({
          title: 'Account deleted',
          message: 'Your account and publications have been removed.',
        });
      })
      .catch((error: unknown) => {
        showErrorToast({
          title: 'Could not delete account',
          message: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => setDeleting(false));
  };

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => setItemsLoading(true));
    getMyItems()
      .then((result) =>
        setItems(result.items as Array<CommunityItem<Record<string, unknown>>>),
      )
      .catch((error: unknown) => {
        setItems([]);
        showErrorToast({
          title: 'Could not load publications',
          message: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => setItemsLoading(false));
  }, [user]);

  if (loading)
    return (
      <Container py="xl">
        <Loader color={accent.primary} />
      </Container>
    );
  if (!user) {
    return (
      <Container size="sm" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <Title order={1}>Account</Title>
          <Card withBorder>
            <Stack>
              <Alert
                color={accent.primary}
                variant="light"
                icon={<IoInformationCircleOutline />}
                title={
                  configured
                    ? 'Community account'
                    : 'Community services are not configured'
                }
              >
                {configured
                  ? 'Sign in to manage linked identities and public teams or tier lists. Browsing and local drafts do not require an account.'
                  : 'Set VITE_API_BASE_URL and restart the frontend to enable sign-in and public publishing. Browsing and local drafts remain available.'}
              </Alert>
              {configured && (
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
              )}
            </Stack>
          </Card>
        </Stack>
      </Container>
    );
  }

  const providers = new Set(
    user.identities.map((identity) => identity.provider),
  );
  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <Group>
          <Avatar
            src={user.avatarUrl}
            size="lg"
            radius="xl"
            color={accent.primary}
          >
            <IoPersonOutline />
          </Avatar>
          <div>
            <Title order={1}>{user.displayName}</Title>
            <Text c="dimmed">
              {user.role === 'moderator' ? 'Moderator' : 'Community member'}
            </Text>
          </div>
        </Group>
        <Card withBorder>
          <Stack>
            <Title order={2} size="h3">
              Linked identities
            </Title>
            {user.identities.length > 1 && (
              <Text c="dimmed" size="sm">
                Your primary identity's name and avatar are shown publicly on
                your published teams and tier lists.
              </Text>
            )}
            {user.identities.map((identity) => (
              <Group key={identity.provider} justify="space-between">
                <Group gap="xs">
                  {identity.provider === 'discord' ? (
                    <IoLogoDiscord />
                  ) : (
                    <IoLogoGithub />
                  )}
                  <Text>{identity.username}</Text>
                  <Badge variant="light" color={accent.primary}>
                    {identity.provider === 'discord' ? 'Discord' : 'GitHub'}
                  </Badge>
                </Group>
                <Group gap="xs">
                  {identity.provider === user.primaryProvider ? (
                    <Badge variant="filled" color={accent.primary}>
                      Primary
                    </Badge>
                  ) : (
                    <Button
                      size="xs"
                      variant="subtle"
                      color={accent.primary}
                      loading={settingPrimary === identity.provider}
                      disabled={settingPrimary !== null}
                      onClick={() => handleSetPrimary(identity.provider)}
                    >
                      Set as primary
                    </Button>
                  )}
                  {user.identities.length > 1 && (
                    <Button
                      size="xs"
                      variant="subtle"
                      color="red"
                      loading={unlinking === identity.provider}
                      disabled={unlinking !== null}
                      onClick={() => handleUnlink(identity.provider)}
                    >
                      Unlink
                    </Button>
                  )}
                </Group>
              </Group>
            ))}
            <Group>
              {!providers.has('discord') && (
                <Button
                  variant="light"
                  color={accent.primary}
                  leftSection={<IoLogoDiscord />}
                  onClick={() => link('discord')}
                >
                  Link Discord
                </Button>
              )}
              {!providers.has('github') && (
                <Button
                  variant="light"
                  color={accent.secondary}
                  leftSection={<IoLogoGithub />}
                  onClick={() => link('github')}
                >
                  Link GitHub
                </Button>
              )}
            </Group>
          </Stack>
        </Card>
        <Stack>
          <Title order={2}>Your publications</Title>
          {itemsLoading ? (
            <Loader size="sm" color={accent.primary} />
          ) : items.length === 0 ? (
            <Text c="dimmed">You have not published anything yet.</Text>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {items.map((item) => {
                const name = String(item.payload.name ?? 'Untitled');
                const path =
                  item.kind === 'team'
                    ? `/teams/${item.id}/${item.slug}`
                    : `/tier-list?list=${encodeURIComponent(item.id)}`;
                return (
                  <Card
                    withBorder
                    className="card-hover-interactive"
                    key={item.id}
                  >
                    <Stack gap="xs">
                      <Anchor component={Link} to={path} fw={600}>
                        {name}
                      </Anchor>
                      <Group gap="xs">
                        <Badge variant="light" color={accent.primary}>
                          {item.kind === 'team' ? 'Team' : 'Tier list'}
                        </Badge>
                        <Text size="sm" c="dimmed">
                          {item.score} upvotes
                        </Text>
                      </Group>
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          )}
        </Stack>
        <Card withBorder>
          <Stack>
            <Title order={2} size="h3" c="red">
              Danger zone
            </Title>
            <Text c="dimmed" size="sm">
              Permanently delete your account, unlink all identities, and
              remove every team and tier list you have published. This cannot
              be undone.
            </Text>
            <Group>
              <Button
                color="red"
                variant="outline"
                loading={deleting}
                onClick={() => setConfirmDeleteAccountOpen(true)}
              >
                Delete account
              </Button>
            </Group>
          </Stack>
        </Card>
      </Stack>
      <ConfirmActionModal
        opened={confirmDeleteAccountOpen}
        onCancel={() => setConfirmDeleteAccountOpen(false)}
        title="Delete your account?"
        message="This permanently deletes your account, unlinks every identity, and removes all of your published teams and tier lists. This cannot be undone."
        confirmLabel="Delete account"
        confirmColor="red"
        onConfirm={handleDeleteAccount}
      />
    </Container>
  );
}
