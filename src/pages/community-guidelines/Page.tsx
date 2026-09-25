import { Anchor, Container, List, Stack, Text, Title } from '@mantine/core';
import { GITHUB_REPO_URL } from '@/constants/github';
import { Link } from 'react-router';

export default function CommunityGuidelinesPage() {
  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <Title order={1}>Community Guidelines</Title>
        <Text c="dimmed">
          These apply to anything you publish publicly through an account —
          teams, tier lists, and any other community content the wiki adds in
          the future. Local drafts saved only in your browser aren't public and
          aren't covered by these guidelines.
        </Text>

        <Stack gap="xs">
          <Title order={2} size="h3">
            What to publish
          </Title>
          <Text>
            Publish teams and tier lists you'd actually recommend to another
            player — real compositions and rankings for Dragon Traveler content.
            Give them a clear name and, where useful, a short description of
            what they're for.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2} size="h3">
            Not allowed
          </Title>
          <List spacing="xs">
            <List.Item>
              <strong>Spam</strong> — duplicate, placeholder, or low-effort
              publications meant to game upvotes or clutter the browse pages.
            </List.Item>
            <List.Item>
              <strong>Broken or invalid data</strong> — compositions or rankings
              that don't reflect real characters, gear, or content types,
              including ones left broken after a game update.
            </List.Item>
            <List.Item>
              <strong>Abusive content</strong> — harassment, hate speech, or
              anything targeting another player or group, including in names and
              descriptions.
            </List.Item>
            <List.Item>
              <strong>Impersonation</strong> — publishing under a name or
              description meant to pass as someone else's work.
            </List.Item>
            <List.Item>
              Anything unrelated to Dragon Traveler strategy content.
            </List.Item>
          </List>
        </Stack>

        <Stack gap="xs">
          <Title order={2} size="h3">
            Your identity
          </Title>
          <Text>
            Published content shows your linked account's real display name and
            avatar (not a made-up "author" field) so other players know who to
            credit — see your{' '}
            <Anchor component={Link} to="/account">
              account page
            </Anchor>{' '}
            for which linked identity is currently primary.
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2} size="h3">
            Reporting and moderation
          </Title>
          <Text>
            If you see something that breaks these guidelines, use the Report
            button on that team or tier list. Moderators review reports and can
            hide or remove content that doesn't belong; repeated or severe
            violations may affect your ability to publish. You can always see
            the status of reports you've filed on your{' '}
            <Anchor component={Link} to="/account">
              account page
            </Anchor>
            .
          </Text>
        </Stack>

        <Stack gap="xs">
          <Title order={2} size="h3">
            Suspensions and bans
          </Title>
          <Text>
            For repeated or serious violations, moderators can suspend an
            account for a set time (1, 7, or 30 days) or ban it permanently. A
            suspended or banned account can still browse the site and delete its
            own publications, but can't publish, edit, vote, or report, and
            can't delete the account or unlink sign-ins while the suspension is
            in force. Moderators may also hide the account's existing
            publications. The reason is shown on your{' '}
            <Anchor component={Link} to="/account">
              account page
            </Anchor>
            . To appeal, open an issue on the{' '}
            <Anchor href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
              project's GitHub repository
            </Anchor>
            .
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
}
