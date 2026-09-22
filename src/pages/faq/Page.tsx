import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import { StaticSurface } from '@/components/ui/Surface';
import { useGradientAccent } from '@/hooks';
import {
  Alert,
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import type { IconType } from 'react-icons';
import {
  IoHelpCircleOutline,
  IoInformationCircleOutline,
  IoLinkOutline,
  IoOpenOutline,
  IoPeople,
  IoSearch,
  IoTicketOutline,
  IoTrophyOutline,
} from 'react-icons/io5';
import { Link } from 'react-router';

type FAQItem = {
  question: string;
  answer: React.ReactNode;
  icon: IconType;
  color: string;
};

type FAQSection = {
  title: string;
  description: string;
  items: FAQItem[];
};

const FAQ_SECTIONS: FAQSection[] = [
  {
    title: 'Getting Started',
    description: 'Core priorities for new and returning players.',
    items: [
      {
        question: 'What should I focus on first as a new player?',
        answer: (
          <>
            Build one stable core team first, push campaign/story milestones,
            and invest resources into upgrades that directly improve your main
            lineup.
          </>
        ),
        icon: IoPeople,
        color: 'blue',
      },
      {
        question: 'Where can I find beginner progression advice?',
        answer: (
          <>
            Start with the{' '}
            <Anchor component={Link} to="/toolbox/beginner-qa">
              Beginner Q&amp;A
            </Anchor>{' '}
            for practical early-game priorities, pull planning, and common
            mistakes.
          </>
        ),
        icon: IoHelpCircleOutline,
        color: 'cyan',
      },
      {
        question: 'I returned after a break. What should I review first?',
        answer: (
          <>
            Check{' '}
            <Anchor component={Link} to="/changelog">
              Changelog
            </Anchor>{' '}
            for recent updates, then review{' '}
            <Anchor component={Link} to="/tier-list">
              Tier List
            </Anchor>{' '}
            and{' '}
            <Anchor component={Link} to="/teams">
              Teams
            </Anchor>{' '}
            to re-align your progression plan.
          </>
        ),
        icon: IoInformationCircleOutline,
        color: 'grape',
      },
      {
        question: 'How should I use tier lists without overcommitting?',
        answer: (
          <>
            Use tier lists as directional guidance, not absolute rules. Account
            copies, available gear, and team synergy often matter more than
            isolated rankings.
          </>
        ),
        icon: IoTrophyOutline,
        color: 'orange',
      },
    ],
  },
  {
    title: 'Navigation & Discovery',
    description: 'Fast ways to find the page or data you need.',
    items: [
      {
        question: 'How do I quickly find characters, gear, or guides?',
        answer: (
          <>
            Use the global search button in the header (or press /) to jump to
            entries and guide pages directly.
          </>
        ),
        icon: IoSearch,
        color: 'teal',
      },
      {
        question: 'What is the fastest way to reach a specific page?',
        answer: (
          <>
            Use the sidebar when browsing by category, and global search when
            you already know part of a page name.
          </>
        ),
        icon: IoSearch,
        color: 'teal',
      },
      {
        question: 'Where can I check active and expired redemption codes?',
        answer: (
          <>
            Open{' '}
            <Anchor component={Link} to="/codes">
              Codes
            </Anchor>{' '}
            for one consolidated list of active and expired entries.
          </>
        ),
        icon: IoTicketOutline,
        color: 'accent',
      },
      {
        question: 'Where are calculators and planning tools located?',
        answer: (
          <>
            You can find tools like the{' '}
            <Anchor component={Link} to="/toolbox/star-upgrade-calculator">
              Star Upgrade Calculator
            </Anchor>{' '}
            and{' '}
            <Anchor component={Link} to="/toolbox/mythic-summon-calculator">
              Mythic Summon Calculator
            </Anchor>{' '}
            and{' '}
            <Anchor component={Link} to="/toolbox/diamond-calculator">
              Diamond Calculator
            </Anchor>{' '}
            in the Guides section.
          </>
        ),
        icon: IoInformationCircleOutline,
        color: 'grape',
      },
    ],
  },
  {
    title: 'Progression & Team Building',
    description: 'How to make practical upgrade and roster decisions.',
    items: [
      {
        question: 'How do I choose between multiple team options?',
        answer: (
          <>
            Compare options on{' '}
            <Anchor component={Link} to="/teams">
              Teams
            </Anchor>{' '}
            and cross-reference with{' '}
            <Anchor component={Link} to="/tier-list">
              Tier List
            </Anchor>{' '}
            context to match your current roster depth.
          </>
        ),
        icon: IoPeople,
        color: 'blue',
      },
      {
        question:
          'Should I spread upgrades across many units or focus one team?',
        answer: (
          <>
            Focused investment is usually more efficient early on. Build one
            reliable team before heavily diversifying into side units.
          </>
        ),
        icon: IoTrophyOutline,
        color: 'orange',
      },
      {
        question: 'How often should I re-evaluate my main lineup?',
        answer: (
          <>
            Re-check after major pulls, important copy breakpoints, and balance
            changes listed in{' '}
            <Anchor component={Link} to="/changelog">
              Changelog
            </Anchor>
            .
          </>
        ),
        icon: IoInformationCircleOutline,
        color: 'grape',
      },
    ],
  },
  {
    title: 'Wiki Data & Technical Notes',
    description: 'How data is maintained and how site behavior works.',
    items: [
      {
        question: 'How often is the wiki updated?',
        answer: (
          <>
            Updates are made continuously as new content and corrections are
            submitted. Notable changes are tracked on{' '}
            <Anchor component={Link} to="/changelog">
              Changelog
            </Anchor>
            .
          </>
        ),
        icon: IoInformationCircleOutline,
        color: 'grape',
      },
      {
        question: 'Can I suggest edits or report incorrect data?',
        answer: (
          <>
            Use the Report issue button on mined catalog pages for corrections.
            Codes and useful links still accept suggestions. Signed-in users can
            publish teams and tier lists directly from their builders and report
            community posts in place.
          </>
        ),
        icon: IoLinkOutline,
        color: 'indigo',
      },
      {
        question: 'Does the wiki save my settings?',
        answer: (
          <>
            Yes. Preferences like view mode, filters, sorting, sidebar state,
            and code tracking are saved in your browser local storage.
          </>
        ),
        icon: IoInformationCircleOutline,
        color: 'grape',
      },
      {
        question: 'How do I sort database items while using grid view?',
        answer: (
          <>
            Switch to list view, set your sort order, then return to grid view.
            Your selected sort order persists.
          </>
        ),
        icon: IoSearch,
        color: 'teal',
      },
      {
        question: 'Are external references and helper tools available?',
        answer: (
          <>
            Yes. The{' '}
            <Anchor component={Link} to="/toolbox/useful-links">
              Useful Links
            </Anchor>{' '}
            page collects official and community resources.
          </>
        ),
        icon: IoLinkOutline,
        color: 'indigo',
      },
    ],
  },
];

function FAQCard({
  question,
  answer,
  icon: Icon,
  color,
  accentColor,
}: {
  question: string;
  answer: React.ReactNode;
  icon: IconType;
  color: string;
  accentColor: string;
}) {
  return (
    <StaticSurface p="md">
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <ThemeIcon
            variant="light"
            color={color === 'accent' ? accentColor : color}
            radius="md"
            size="md"
          >
            <Icon size={16} />
          </ThemeIcon>
          <Text fw={700} style={{ flex: 1 }}>
            {question}
          </Text>
        </Group>
        <Text size="sm" c="dimmed" style={{ paddingLeft: 36 }}>
          {answer}
        </Text>
      </Stack>
    </StaticSurface>
  );
}

function FAQSectionCard({
  section,
  accentColor,
}: {
  section: FAQSection;
  accentColor: string;
}) {
  return (
    <CollapsibleSectionCard
      color={accentColor}
      header={
        <Stack gap={2}>
          <Title order={3}>{section.title}</Title>
          <Text size="sm" c="dimmed">
            {section.description}
          </Text>
        </Stack>
      }
    >
      <Stack gap="xs">
        {section.items.map((item) => (
          <FAQCard
            key={item.question}
            question={item.question}
            answer={item.answer}
            icon={item.icon}
            color={item.color}
            accentColor={accentColor}
          />
        ))}
      </Stack>
    </CollapsibleSectionCard>
  );
}

export default function FAQ() {
  const { accent } = useGradientAccent();

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <Stack gap={2}>
          <Title order={1}>FAQ</Title>
          <Text size="sm" c="dimmed">
            Quick answers about wiki usage and beginner-friendly progression
            priorities.
          </Text>
        </Stack>

        <Stack gap="md">
          {FAQ_SECTIONS.map((section) => (
            <FAQSectionCard
              key={section.title}
              section={section}
              accentColor={accent.primary}
            />
          ))}
        </Stack>

        <Divider />

        <StaticSurface p="lg">
          <Stack gap="sm">
            <Title order={2}>Source Reference</Title>
            <Alert
              variant="light"
              color="yellow"
              title="Translation note"
              icon={<IoInformationCircleOutline />}
            >
              The embedded page below is an external community source used for
              translation/adaptation. If it does not load, open it directly:{' '}
              <Anchor
                href="https://www.gamekee.com/lhlr"
                target="_blank"
                rel="noopener noreferrer"
              >
                GameKee Dragon Traveler Reference
              </Anchor>
              .
            </Alert>
            <StaticSurface radius="md" p={0} style={{ overflow: 'hidden' }}>
              <Box
                component="iframe"
                src="https://www.gamekee.com/lhlr"
                title="GameKee Dragon Traveler Reference"
                style={{ width: '100%', height: 460, border: 0 }}
                loading="lazy"
              />
            </StaticSurface>
            <Group>
              <Button
                component="a"
                href="https://www.gamekee.com/lhlr"
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                rightSection={<IoOpenOutline size={14} />}
              >
                Open source in new tab
              </Button>
            </Group>
          </Stack>
        </StaticSurface>
      </Stack>
    </Container>
  );
}
