import {
  Badge,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IoCalendar,
  IoGameController,
  IoGlobe,
  IoList,
  IoPricetag,
  IoStatsChart,
  IoTrophy,
} from 'react-icons/io5';
import {
  CharacterOwnershipContext,
  TierListReferenceContext,
} from '@/contexts';
import { useGradientAccent } from '@/hooks';
import { useContext } from 'react';
import ActiveCodesSection from '@/features/home/components/ActiveCodesSection';
import ActiveEventsSection from '@/features/home/components/ActiveEventsSection';
import DataStatsBar from '@/features/home/components/DataStatsBar';
import FeaturedCharactersMarquee from '@/features/home/components/FeaturedCharactersMarquee';
import HomeHeroSection from '@/features/home/components/HomeHeroSection';
import HomeSectionCard from '@/features/home/components/HomeSectionCard';
import RecentUpdatesSection from '@/features/home/components/RecentUpdatesSection';
import ScrollReveal from '@/components/ui/ScrollReveal';

const GENRES = ['Strategy', 'RPG', 'Card Game', 'Idle', 'Comedy', 'Anime'];

const LANGUAGES = [
  'English',
  'Japanese',
  'Korean',
  'Simplified Chinese',
  'Traditional Chinese',
  'Thai',
  'Vietnamese',
];

export default function Home() {
  const { accent } = useGradientAccent();
  const { showCharacterTiers } = useContext(CharacterOwnershipContext);
  const { selectedTierList } = useContext(TierListReferenceContext);

  return (
    <Stack gap={0}>
      <HomeHeroSection />

      <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
        <Stack gap="xl">
          {/* Featured characters come from the reference tier list, so the whole
              section is omitted when there's no default and no chosen list. */}
          {showCharacterTiers && selectedTierList && (
            <ScrollReveal>
              <HomeSectionCard
                title="Featured Characters"
                icon={IoTrophy}
                to="/tier-list"
                linkLabel="View tier list"
              >
                <FeaturedCharactersMarquee />
              </HomeSectionCard>
            </ScrollReveal>
          )}

          <ScrollReveal>
            <HomeSectionCard
              title="Active Events"
              icon={IoCalendar}
              to="/events"
              linkLabel="View all events"
            >
              <ActiveEventsSection />
            </HomeSectionCard>
          </ScrollReveal>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <ScrollReveal>
              <HomeSectionCard
                title="Active Codes"
                icon={IoPricetag}
                to="/codes"
                linkLabel="View all codes"
              >
                <ActiveCodesSection />
              </HomeSectionCard>
            </ScrollReveal>

            <ScrollReveal delay={80}>
              <HomeSectionCard
                title="Recent Updates"
                icon={IoList}
                to="/changelog"
                linkLabel="View full changelog"
              >
                <RecentUpdatesSection />
              </HomeSectionCard>
            </ScrollReveal>
          </SimpleGrid>

          <ScrollReveal>
            <HomeSectionCard title="Database" icon={IoStatsChart}>
              <DataStatsBar />
            </HomeSectionCard>
          </ScrollReveal>

          <ScrollReveal>
            <HomeSectionCard title="About the Game" icon={IoGameController}>
              <Stack gap="md">
                <Text size="sm" fs="italic" c="dimmed">
                  Love x Comedy x Isekai = The Ultimate Bishoujo RPG!
                </Text>
                <Text size="sm">
                  Dragon Traveler is a free-to-play idle RPG developed and
                  published by GameTree. Play as Fafnir, heir of the legendary
                  dragon, in a rom-com isekai adventure featuring card-based
                  combat, strategic Dragon Soul mechanics, and a colorful cast
                  of characters.
                </Text>
                <Group gap="xs" wrap="wrap">
                  {GENRES.map((genre) => (
                    <Badge
                      key={genre}
                      variant="light"
                      color={accent.primary}
                      size="sm"
                    >
                      {genre}
                    </Badge>
                  ))}
                  <Badge variant="light" color={accent.secondary} size="sm">
                    Free to Play
                  </Badge>
                </Group>
                <Group gap="xs" wrap="wrap" align="center">
                  <ThemeIcon
                    variant="light"
                    color={accent.secondary}
                    size="md"
                    radius="md"
                    style={{ flexShrink: 0 }}
                  >
                    <IoGlobe size={16} />
                  </ThemeIcon>
                  {LANGUAGES.map((lang) => (
                    <Badge
                      key={lang}
                      variant="light"
                      color={accent.secondary}
                      size="sm"
                    >
                      {lang}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            </HomeSectionCard>
          </ScrollReveal>
        </Stack>
      </Container>
    </Stack>
  );
}
