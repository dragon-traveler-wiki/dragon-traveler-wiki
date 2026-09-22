import { Avatar, Button, Loader, Menu, Text, Tooltip } from '@mantine/core';
import { useGradientAccent } from '@/hooks';
import {
  IoLogoDiscord,
  IoLogoGithub,
  IoLogInOutline,
  IoLogOutOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import { useCommunityAuth } from './auth-context';
import { Link } from 'react-router';

export default function AccountMenu() {
  const { user, configured, loading, login, logout } = useCommunityAuth();
  const { accent } = useGradientAccent();
  if (loading)
    return (
      <Button
        variant="light"
        color={accent.primary}
        size="compact-sm"
        aria-label="Loading account"
        disabled
      >
        <Loader size="xs" color={accent.primary} />
      </Button>
    );
  if (!configured) {
    return (
      <Tooltip label="Community sign-in is not configured" position="bottom">
        <span style={{ display: 'inline-flex' }}>
          <Button
            variant="light"
            color={accent.primary}
            size="compact-sm"
            leftSection={<IoLogInOutline />}
            disabled
            style={{ pointerEvents: 'none' }}
          >
            Sign in
          </Button>
        </span>
      </Tooltip>
    );
  }
  if (!user) {
    return (
      <Menu shadow="md" position="bottom-end" width={220} withArrow>
        <Menu.Target>
          <Button
            variant="light"
            color={accent.primary}
            size="compact-sm"
            leftSection={<IoLogInOutline />}
            aria-label="Sign in"
          >
            Sign in
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Publish to the community</Menu.Label>
          <Menu.Item
            leftSection={<IoLogoDiscord />}
            color={accent.primary}
            onClick={() => login('discord')}
          >
            Continue with Discord
          </Menu.Item>
          <Menu.Item
            leftSection={<IoLogoGithub />}
            color={accent.secondary}
            onClick={() => login('github')}
          >
            Continue with GitHub
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }
  return (
    <Menu shadow="md" position="bottom-end" width={220} withArrow>
      <Menu.Target>
        <Button
          variant="light"
          color={accent.primary}
          size="compact-sm"
          leftSection={
            <Avatar
              src={user.avatarUrl}
              size={20}
              radius="xl"
              color={accent.primary}
            >
              <IoPersonOutline />
            </Avatar>
          }
        >
          <Text span visibleFrom="sm">
            {user.displayName}
          </Text>
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user.displayName}</Menu.Label>
        <Menu.Item
          component={Link}
          to="/account"
          leftSection={<IoPersonOutline />}
          color={accent.primary}
        >
          Account & publications
        </Menu.Item>
        {user.role === 'moderator' && (
          <Menu.Item
            component={Link}
            to="/moderation"
            leftSection={<IoShieldCheckmarkOutline />}
            color={accent.secondary}
          >
            Moderation
          </Menu.Item>
        )}
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IoLogOutOutline />}
          onClick={() => void logout()}
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
