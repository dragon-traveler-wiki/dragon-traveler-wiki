import { Anchor, Container, List, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';
import ListPageHeader from '@/components/layout/ListPageHeader';
import { GITHUB_REPO_URL } from '@/constants/github';

export default function PrivacyPage() {
  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <ListPageHeader
          title="Privacy Policy"
          description="This page covers the community account system (sign-in, publishing, voting, reporting). Browsing the wiki itself and using local, saved drafts don't require an account and aren't covered here."
        />

        <Stack gap="xs">
          <Title order={2} size="h3">
            What we collect
          </Title>
          <Text>
            When you sign in with Discord or GitHub, we only request the minimal
            scope needed to identify you (Discord <code>identify</code>, GitHub{' '}
            <code>read:user</code>) — neither requests your email address, and
            we never see or store one.
          </Text>
          <List spacing="xs">
            <List.Item>
              From your OAuth provider: your provider user ID, username, and
              avatar image URL.
            </List.Item>
            <List.Item>
              From you: whatever teams, tier lists, votes, and reports you
              choose to publish, plus a session cookie that keeps you signed in.
            </List.Item>
            <List.Item>
              Your IP address is used transiently to rate-limit abusive requests
              and verify the Turnstile challenge on publish/report actions — it
              is not stored in our database.
            </List.Item>
          </List>
        </Stack>

        <Stack gap="xs">
          <Title order={2} size="h3">
            How it's used
          </Title>
          <Text>
            Your display name and avatar are shown publicly next to anything you
            publish, so other players know who to credit — see the{' '}
            <Anchor component={Link} to="/community-guidelines">
              Community Guidelines
            </Anchor>{' '}
            for what that means in practice. We don't use your data for
            advertising, analytics profiling, or anything beyond running the
            community features themselves.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2} size="h3">
            Moderation records
          </Title>
          <Text>
            When a moderator hides, restores, or deletes content, or suspends or
            bans an account, we keep a record of the action, who took it, and
            any reason given. A suspension's reason is shown to the affected
            user. These records are kept for running and auditing the site and
            aren't shown publicly. Reports themselves are removed automatically
            90 days after a moderator handles them (open reports are kept until
            handled), and you can withdraw a report of your own while it's still
            open.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2} size="h3">
            Who else sees it
          </Title>
          <Text>
            Data is stored on Cloudflare (Workers and D1) and never sold or
            shared with third parties beyond what's needed to run the site:
            Cloudflare for hosting and Turnstile bot verification, and
            Discord/GitHub for the sign-in itself.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2} size="h3">
            Your data, your control
          </Title>
          <Text>
            From your{' '}
            <Anchor component={Link} to="/account">
              account page
            </Anchor>{' '}
            you can unlink an identity, switch which linked identity is primary,
            or delete your account entirely — which removes your linked
            identities and unpublishes everything you've published. Deleting
            your account can't be undone.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2} size="h3">
            Questions
          </Title>
          <Text>
            This is a small fan-run project, not a company — if you have
            questions or want data removed beyond what the account page covers,
            open an issue on{' '}
            <Anchor
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Anchor>
            .
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
