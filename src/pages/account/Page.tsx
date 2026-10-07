import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Button,
  Container,
  Group,
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
import ListPageHeader from '@/components/layout/ListPageHeader';
import { AccountPageLoading } from '@/components/layout/PageLoadingSkeleton';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import { StaticSurface } from '@/components/ui/Surface';
import { getMyItems, getMyReports } from '@/features/community/api';
import MyPublications from '@/features/community/MyPublications';
import MyReports from '@/features/community/MyReports';
import { errorMessage, runAction } from '@/features/community/run-action';
import SuspensionNotice from '@/features/community/SuspensionNotice';
import CommunityStatsBadges from '@/features/community/CommunityStatsBadges';
import { useCommunityAuth } from '@/features/community/auth-context';
import type { CommunityItem, MyReport } from '@/features/community/types';
import { useGradientAccent } from '@/hooks';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { PAGE_WIDTH } from '@/constants/ui';

type IdentityProvider = 'discord' | 'github';

const PROVIDER_LABELS: Record<IdentityProvider, string> = {
  discord: 'Discord',
  github: 'GitHub',
};

const UNCONFIGURED_MESSAGE = import.meta.env.DEV
  ? 'Set VITE_API_BASE_URL and restart the frontend to enable sign-in and public publishing. Browsing and local drafts remain available.'
  : 'Sign-in and public publishing are currently unavailable. Browsing and local drafts remain available.';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  link_conflict:
    'That account is already linked to a different profile. Log in with the other provider first — if that profile is one you no longer want, you can delete it from its account page to free up the identity.',
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
    refresh,
  } = useCommunityAuth();
  const { accent } = useGradientAccent();
  const [items, setItems] = useState<
    Array<CommunityItem<Record<string, unknown>>>
  >([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [itemsVersion, setItemsVersion] = useState(0);
  const [reports, setReports] = useState<MyReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportsVersion, setReportsVersion] = useState(0);
  const [unlinking, setUnlinking] = useState<IdentityProvider | null>(null);
  const [pendingUnlink, setPendingUnlink] = useState<IdentityProvider | null>(
    null,
  );
  const [settingPrimary, setSettingPrimary] = useState<IdentityProvider | null>(
    null,
  );
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

  const handleUnlink = async (provider: IdentityProvider) => {
    setPendingUnlink(null);
    setUnlinking(provider);
    await runAction(() => unlink(provider), {
      errorTitle: 'Could not unlink identity',
    });
    setUnlinking(null);
  };

  const handleSetPrimary = async (provider: IdentityProvider) => {
    setSettingPrimary(provider);
    await runAction(() => setPrimary(provider), {
      errorTitle: 'Could not set primary identity',
    });
    setSettingPrimary(null);
  };

  const handleDeleteAccount = async () => {
    setConfirmDeleteAccountOpen(false);
    setDeleting(true);
    await runAction(() => deleteAccount(), {
      errorTitle: 'Could not delete account',
      success: {
        title: 'Account deleted',
        message: 'Your account and publications have been removed.',
      },
    });
    setDeleting(false);
  };

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      setItemsLoading(true);
      setItemsError(null);
    });
    getMyItems()
      .then((result) =>
        setItems(result.items as Array<CommunityItem<Record<string, unknown>>>),
      )
      .catch((error: unknown) => {
        setItems([]);
        setItemsError(errorMessage(error));
      })
      .finally(() => setItemsLoading(false));
    // Only re-run when the logged-in user changes or on retry, not on every
    // auth context refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, itemsVersion]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      setReportsLoading(true);
      setReportsError(null);
    });
    getMyReports()
      .then((result) => {
        setReports(result.reports);
        // Viewing this page marks reports as seen server-side; refresh the
        // auth context so the unread badge in the header clears right away.
        void refresh();
      })
      .catch((error: unknown) => {
        setReports([]);
        setReportsError(errorMessage(error));
      })
      .finally(() => setReportsLoading(false));
    // Only re-run when the logged-in user changes or on retry, not on every
    // auth context refresh (which would otherwise loop, since this effect
    // itself triggers a refresh).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, reportsVersion]);

  if (loading) return <AccountPageLoading />;
  if (!user) {
    return (
      <Container size={PAGE_WIDTH.NARROW} py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="lg">
          <ListPageHeader title="Account" />
          <StaticSurface p="md">
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
                  : UNCONFIGURED_MESSAGE}
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
          </StaticSurface>
        </Stack>
      </Container>
    );
  }

  const providers = new Set(
    user.identities.map((identity) => identity.provider),
  );
  return (
    <Container size={PAGE_WIDTH.WIDE} py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <Group wrap="nowrap">
          <Avatar
            src={user.avatarUrl}
            size="lg"
            radius="xl"
            color={accent.primary}
          >
            <IoPersonOutline />
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Title
              order={1}
              fz={{ base: '1.5rem', sm: '2.125rem' }}
              style={{ wordBreak: 'break-word' }}
            >
              {user.displayName}
            </Title>
            <Text c="dimmed">
              {user.role === 'moderator' ? 'Moderator' : 'Community member'}
            </Text>
          </div>
        </Group>
        {user.suspension && <SuspensionNotice suspension={user.suspension} />}
        <CommunityStatsBadges
          stats={{
            teams: items.filter(
              (item) => item.kind === 'team' && item.status === 'published',
            ).length,
            tierLists: items.filter(
              (item) =>
                item.kind === 'tier_list' && item.status === 'published',
            ).length,
            upvotes: items
              .filter((item) => item.status === 'published')
              .reduce((total, item) => total + item.score, 0),
          }}
        />
        <Anchor component={Link} to={`/profile/${user.id}`} size="sm">
          View your public profile
        </Anchor>
        <StaticSurface p="md">
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
                    {PROVIDER_LABELS[identity.provider]}
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
                      onClick={() => setPendingUnlink(identity.provider)}
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
        </StaticSurface>
        <MyPublications
          items={items}
          loading={itemsLoading}
          error={itemsError}
          onRetry={() => setItemsVersion((version) => version + 1)}
          onRemoved={(id) =>
            setItems((current) => current.filter((item) => item.id !== id))
          }
        />
        <MyReports
          reports={reports}
          loading={reportsLoading}
          error={reportsError}
          onRetry={() => setReportsVersion((version) => version + 1)}
          onWithdrawn={(id) =>
            setReports((current) => current.filter((r) => r.id !== id))
          }
        />
        <StaticSurface p="md">
          <Stack>
            <Title order={2} size="h3" c="red">
              Danger zone
            </Title>
            <Text c="dimmed" size="sm">
              Permanently delete your account, unlink all identities, and remove
              every team and tier list you have published. This cannot be
              undone.
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
        </StaticSurface>
      </Stack>
      <ConfirmActionModal
        opened={pendingUnlink !== null}
        onCancel={() => setPendingUnlink(null)}
        title="Unlink this identity?"
        message="You will no longer be able to sign in with this identity unless you link it again."
        confirmLabel="Unlink"
        confirmColor="red"
        onConfirm={() => {
          if (pendingUnlink) void handleUnlink(pendingUnlink);
        }}
      />
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
