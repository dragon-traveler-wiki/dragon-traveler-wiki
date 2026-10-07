import TranslationNote from '@/components/common/TranslationNote';
import ListPageHeader from '@/components/layout/ListPageHeader';
import SectionJumpNav from '@/components/layout/SectionJumpNav';
import ResolvedHowlkinBadge from '@/components/ui/ResolvedHowlkinBadge';
import ResourceBadge from '@/components/ui/ResourceBadge';
import WyrmspellBadge from '@/components/ui/WyrmspellBadge';
import { StaticSurface } from '@/components/ui/Surface';
import { getMinWidthStyle } from '@/constants/styles';
import CharacterTag from '@/features/characters/components/CharacterTag';
import {
  Box,
  Container,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core';

const FACTION_GIFTS: {
  faction: string;
  ssr: { slug: string; pts: number };
  sr: { slug: string; pts: number };
  r: { slug: string; pts: number };
  n: { slug: string; pts: number };
}[] = [
  {
    faction: 'Any',
    ssr: { slug: 'luxury_tea_set', pts: 150 },
    sr: { slug: 'grilled_steak', pts: 75 },
    r: { slug: 'banquet_cake', pts: 30 },
    n: { slug: 'fresh_apple', pts: 15 },
  },
  {
    faction: 'Elemental Echo',
    ssr: { slug: 'amber_necklace', pts: 100 },
    sr: { slug: 'obsidian_arrowhead', pts: 50 },
    r: { slug: 'coral_ornament', pts: 20 },
    n: { slug: 'dandelion', pts: 10 },
  },
  {
    faction: 'Illusion Veil',
    ssr: { slug: 'black_lotus', pts: 100 },
    sr: { slug: 'forbidden_scroll', pts: 50 },
    r: { slug: 'rotten_branch', pts: 20 },
    n: { slug: 'cave_mushroom', pts: 10 },
  },
  {
    faction: 'Arcane Wisdom',
    ssr: { slug: 'lilac_and_gooseberry', pts: 100 },
    sr: { slug: 'potion_class_notes', pts: 50 },
    r: { slug: 'ink_and_quill', pts: 20 },
    n: { slug: 'manna', pts: 10 },
  },
  {
    faction: 'Otherworld Return',
    ssr: { slug: 'soul_bell', pts: 100 },
    sr: { slug: 'graveyard_lily', pts: 50 },
    r: { slug: 'preservative', pts: 20 },
    n: { slug: 'ritual_candle', pts: 10 },
  },
  {
    faction: 'Sanctum Glory',
    ssr: { slug: 'stained_glass_window_decoration', pts: 100 },
    sr: { slug: 'griffin_doll', pts: 50 },
    r: { slug: 'a_knights_tale', pts: 20 },
    n: { slug: 'wooden_training_sword', pts: 10 },
  },
  {
    faction: 'Wild Spirit',
    ssr: { slug: 'treant_sapling', pts: 100 },
    sr: { slug: 'ring_casting_mold', pts: 50 },
    r: { slug: 'fairy_dust', pts: 20 },
    n: { slug: 'elven_biscuit', pts: 10 },
  },
];

const GUILD_EXPEDITION_PRIORITIES: {
  priority: number;
  objective: React.ReactNode;
  reward: React.ReactNode;
}[] = [
  { priority: 1, objective: 'Rune Crystals', reward: '10x Class Rune' },
  {
    priority: 2,
    objective: 'Bosses',
    reward: (
      <>
        Chance for key,{' '}
        <ResourceBadge size="xs" slug="leaf_of_the_world_tree" />, Auction
        addition
      </>
    ),
  },
  {
    priority: 3,
    objective: 'Normal enemies/ locked chests',
    reward: (
      <>
        Key, <ResourceBadge size="xs" slug="leaf_of_the_world_tree" /> / Gems,
        Faction Runes, <ResourceBadge size="xs" slug="dragonblood" />
      </>
    ),
  },
  {
    priority: 4,
    objective: 'Dragon Soul Statues',
    reward: '1x RANDOM SR Dragon Shard',
  },
  {
    priority: 5,
    objective: 'Three Dragon Soul Statues',
    reward: '1x RANDOM SSR Dragon Shard',
  },
  { priority: 6, objective: 'Rune Monument', reward: '1x Class Rune' },
  {
    priority: 7,
    objective: 'Cart Full of Dragon Souls',
    reward: (
      <>
        1x <ResourceBadge size="xs" slug="wyrm_essence" /> Pack (1 hr)
      </>
    ),
  },
  {
    priority: 8,
    objective: 'Dragon Soul Stone',
    reward: (
      <>
        5x <ResourceBadge size="xs" slug="wyrm_essence" />
      </>
    ),
  },
  {
    priority: 9,
    objective: 'Ancient Tree',
    reward: (
      <>
        1x <ResourceBadge size="xs" slug="luminary_exp" /> Pack (1 hr)
      </>
    ),
  },
  {
    priority: 10,
    objective: 'Cart Full of Gold',
    reward: (
      <>
        1x <ResourceBadge size="xs" slug="gold" /> Pack (1 hr)
      </>
    ),
  },
  {
    priority: 11,
    objective: 'Gold',
    reward: (
      <>
        7500 <ResourceBadge size="xs" slug="gold" />
      </>
    ),
  },
];

const JUMP_SECTIONS = [
  { id: 'beginner-summoning', label: 'Summoning' },
  { id: 'beginner-economy', label: 'Economy' },
  { id: 'beginner-progression', label: 'Progression' },
  { id: 'beginner-events', label: 'Events & Guilds' },
  { id: 'beginner-affection', label: 'Affection Gifts' },
  { id: 'beginner-combat', label: 'Combat' },
];

/** Keeps an inline chip and its trailing punctuation on the same line. */
function NoWrap({ children }: { children: React.ReactNode }) {
  return <span style={{ whiteSpace: 'nowrap' }}>{children}</span>;
}

function QA({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <StaticSurface p={{ base: 'sm', sm: 'md' }}>
      <Stack gap="xs">
        <Group align="flex-start" gap={6} wrap="nowrap">
          <Text fw={700}>Q:</Text>
          <Text fw={700} component="div" style={{ flex: 1, minWidth: 0 }}>
            {q}
          </Text>
        </Group>
        <Group align="flex-start" gap={6} wrap="nowrap">
          <Text size="sm" c="dimmed" fw={700}>
            A:
          </Text>
          <Text
            size="sm"
            c="dimmed"
            component="div"
            style={{ flex: 1, minWidth: 0 }}
          >
            {children}
          </Text>
        </Group>
      </Stack>
    </StaticSurface>
  );
}

export default function BeginnerQA() {
  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <ListPageHeader
          title="Beginner Q&A"
          description="Fast answers for early progression, spending priorities, and event planning."
        />

        <TranslationNote
          sourceHref="https://www.gamekee.com/lhlr/670682.html"
          sourceLabel="萌新Q&A / Beginner Q&A"
        />

        <SectionJumpNav sections={JUMP_SECTIONS} />

        <StaticSurface id="beginner-summoning" p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Summoning &amp; Characters
            </Title>

            <QA q="Which characters should I prioritize summoning?">
              Go for at least 8 copies of <CharacterTag slug="ifrit_ssr_plus" />{' '}
              (AoE attack, physical defense reduction) to reach Red 1★ for the
              powerful Level 4 passive. Then try to summon at least 1 copy of
              each limited character.
            </QA>

            <QA q="How should I pull characters strategically?">
              Most characters need higher stars to become fully viable. For
              F2P/new players, save <ResourceBadge slug="diamond" /> and{' '}
              <ResourceBadge slug="fated_summoning_ticket" /> for strong
              universal cards or for your core team archetype. Target Purple 6★
              / Red 1★ to unlock Level 4 passives.
            </QA>

            <QA q="How should I set my Wishlist?">
              Fill all 8 slots or it will not activate. For SSR+, take up to two{' '}
              <NoWrap>
                <CharacterTag slug="titania_ssr_plus" />,
              </NoWrap>{' '}
              then prioritize{' '}
              <NoWrap>
                <CharacterTag slug="scheherazade_ssr_plus" />,
              </NoWrap>{' '}
              <NoWrap>
                <CharacterTag slug="huginn_muninn_ssr_plus" />,
              </NoWrap>{' '}
              <NoWrap>
                <CharacterTag slug="gullveig_ssr_plus" />,
              </NoWrap>{' '}
              and{' '}
              <NoWrap>
                <CharacterTag slug="anubis_ssr_plus" />.
              </NoWrap>{' '}
              Also, try to acquire one copy of each SSR+ Luminary.
              <br />
              For SSR, prioritize{' '}
              <NoWrap>
                <CharacterTag slug="atanith_ssr" />,
              </NoWrap>{' '}
              <NoWrap>
                <CharacterTag slug="lorilin_ssr" />,
              </NoWrap>{' '}
              <NoWrap>
                <CharacterTag slug="nemesis_ssr" />,
              </NoWrap>{' '}
              <NoWrap>
                <CharacterTag slug="chiron_ssr" />,
              </NoWrap>{' '}
              <NoWrap>
                <CharacterTag slug="caligula_ssr" />,
              </NoWrap>{' '}
              and{' '}
              <NoWrap>
                <CharacterTag slug="herman_ssr" />.
              </NoWrap>
              <br />
              Note that this is just the recommended order for F2P and new
              players; if you have a specific team composition in mind, you may
              want to prioritize different characters.
            </QA>
          </Stack>
        </StaticSurface>

        <StaticSurface id="beginner-economy" p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Economy &amp; Shopping
            </Title>

            <QA q="What is the best way to spend Diamonds?">
              Priority path: shop essentials &gt; sweeps (except Wyrm Essence)
              &gt; golden clover resources &gt; planned pulls &gt; patrols &gt;
              auctions.
              <br />
              Avoid unplanned pulls or standard-pool pulls.
            </QA>

            <QA q="Which shops should I buy from?">
              • Mystery Shop: <ResourceBadge slug="exploration_guide" />{' '}
              (daily), <ResourceBadge slug="primal_amber" /> (monthly).
              <br />• Arena Shop: discounted{' '}
              <ResourceBadge slug="mythic_summoning_ticket" /> &gt;{' '}
              <ResourceBadge slug="primal_amber" /> &gt; full-price{' '}
              <NoWrap>
                <ResourceBadge slug="mythic_summoning_ticket" />.
              </NoWrap>
              <br />• God Realm Shop: <ResourceBadge slug="fate_horn" />{' '}
              (weekly) &gt; <ResourceBadge slug="aurora_dust" /> (daily) &gt;{' '}
              <CharacterTag slug="medusa_ssr" /> (SSR, one copy first, then
              shards).
              <br />• Guild Shop: <ResourceBadge slug="dragonblood" /> (weekly)
              &gt; shards. Buy <ResourceBadge slug="leaf_of_the_world_tree" />{' '}
              here if stuck on evolution.
            </QA>

            <QA q="How should I buy Treasure Hunt resources?">
              Prioritize daily purchases based on your Diamond reserve:
              <br />• 1 <ResourceBadge slug="soul_elixir" /> (up to 3 if needed)
              <br />• 1 <ResourceBadge slug="legacy_dragon_crystal" /> (up to 5
              if needed)
              <br />• 5-10 <ResourceBadge slug="golden_horn" /> (recommended to
              stop buying after core artifacts are unlocked)
              <br />
              Save everything until the matching event starts. Buy ALL fate
              resources available in each cycle, but feel free to save them.
            </QA>
          </Stack>
        </StaticSurface>

        <StaticSurface id="beginner-progression" p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Progression &amp; Mechanics
            </Title>

            <QA q="What is the level cap for Luminaries?">
              After level 100, the cap increases by 50 each stage (150, 200,
              250, 300), then continues to Peak level.
            </QA>

            <QA q="How do I evolve Dragons?">
              Dragon star-up uses Dragon Souls. If you lack the exact soul, you
              can substitute lower-tier souls or{' '}
              <NoWrap>
                <ResourceBadge slug="dragonblood" />.
              </NoWrap>{' '}
              Conversion: 3 Small = 1 Medium, and 4 Medium = 1 Large.
            </QA>

            <QA q="What should I prioritize in Dispatch?">
              <ResourceBadge slug="luminary_exp" /> ≥{' '}
              <ResourceBadge slug="gold" /> &gt;{' '}
              <ResourceBadge slug="leaf_of_the_world_tree" /> ≥{' '}
              <NoWrap>
                <ResourceBadge slug="diamond" />.
              </NoWrap>
            </QA>

            <QA q="What attributes are best for equipment?">
              • Frontline: Block ≥ HP &gt; Physical Defense &gt; Magic Defense.
              <br />• DPS: Independent Damage Boost &gt; CD Reduction ≥ Crit DMG
              &gt; Attack Speed &gt; Crit Rate.
              <br />• Healer: CD Reduction &gt; Healing Power &gt; HP.
            </QA>
          </Stack>
        </StaticSurface>

        <StaticSurface id="beginner-events" p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Events &amp; Guilds
            </Title>

            <QA q="How do Golden Leaf events work?">
              Events rotate weekly (Howlkins → Wyrmspells → Artifacts).
              Typically aim to complete one full round (commonly 270 or 900
              pulls) to secure the core reward (12 Golden Leaves). If you cannot
              complete the round, try to just reach the 500 breakpoint or skip +
              save.
            </QA>

            <QA q="What should I exchange Golden Leaves for?">
              <ResolvedHowlkinBadge slug="black_dragon" /> ≥{' '}
              <ResolvedHowlkinBadge slug="pumpkin_knight" /> &gt;{' '}
              <WyrmspellBadge slug="agility_aura" /> &gt; Mythic Wyrm Spells
              &gt; <ResolvedHowlkinBadge slug="titan" /> ≥{' '}
              <ResolvedHowlkinBadge slug="hydra" /> &gt; Mythic Artifacts.
              <br />
              Avoid exchanging for Diamond-equivalent currency or generic
              shards.
            </QA>

            <QA q="What are the Guild priorities?">
              Always do Guild Wars (losses still give points). Always hit the
              Guild Dragon (primary{' '}
              <ResourceBadge slug="leaf_of_the_world_tree" /> source). In
              Exploration, prioritize Limited Resources &gt; Rune Crystals &gt;
              Dragon Soul Statues.
              <br />
              <br />
              Guild Expedition priority:
              <Box mt="xs">
                <Table
                  striped
                  withTableBorder
                  withColumnBorders
                  horizontalSpacing={6}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th aria-label="Priority">#</Table.Th>
                      <Table.Th>Objective</Table.Th>
                      <Table.Th>Reward</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {GUILD_EXPEDITION_PRIORITIES.map(
                      ({ priority, objective, reward }) => (
                        <Table.Tr key={priority}>
                          <Table.Td>
                            <Text size="sm" fw={600}>
                              {priority}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{objective}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">
                              {reward}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ),
                    )}
                  </Table.Tbody>
                </Table>
              </Box>
            </QA>
          </Stack>
        </StaticSurface>

        <StaticSurface id="beginner-affection" p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Affection Gifts
            </Title>
            <Text size="sm" c="dimmed">
              Each faction has one preferred gift per quality tier. Faction
              gifts give the listed affection points to Luminaries of that
              faction. Universal gifts (Any) work on all Luminaries but yield
              fewer points than a matched faction gift.
            </Text>
            <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
              <Table
                striped
                withTableBorder
                withColumnBorders
                style={getMinWidthStyle(520)}
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Faction</Table.Th>
                    <Table.Th>SSR</Table.Th>
                    <Table.Th>SR</Table.Th>
                    <Table.Th>R</Table.Th>
                    <Table.Th>N</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {FACTION_GIFTS.map(({ faction, ssr, sr, r, n }) => (
                    <Table.Tr key={faction}>
                      <Table.Td>
                        <Text
                          size="sm"
                          fw={faction === 'Any' ? 600 : undefined}
                        >
                          {faction}
                        </Text>
                      </Table.Td>
                      {[ssr, sr, r, n].map((gift) => (
                        <Table.Td key={gift.slug}>
                          <Group gap={4} wrap="nowrap">
                            <ResourceBadge slug={gift.slug} />
                            <Text
                              size="xs"
                              c="dimmed"
                              style={{ whiteSpace: 'nowrap' }}
                            >
                              +{gift.pts}
                            </Text>
                          </Group>
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        </StaticSurface>

        <StaticSurface id="beginner-combat" p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="sm">
            <Title order={2} size="h3">
              Combat Strategy
            </Title>

            <QA q="Why is Physical Defense usually prioritized over Magic Defense?">
              Most magic damage comes from Mages and Priests; Priests are
              commonly support-focused with lower output. Many meta Mages are
              currently utility-focused, with fewer high-damage exceptions (such
              as <CharacterTag slug="gabriele_ssr_plus" /> or{' '}
              <NoWrap>
                <CharacterTag slug="poseidon_ssr_ex" />
                ),
              </NoWrap>{' '}
              so physical pressure is often more common.
            </QA>
          </Stack>
        </StaticSurface>
      </Stack>
    </Container>
  );
}
