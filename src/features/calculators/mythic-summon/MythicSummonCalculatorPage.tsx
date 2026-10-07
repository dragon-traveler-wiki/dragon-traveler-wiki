import ListPageHeader from '@/components/layout/ListPageHeader';
import MythicSummonReference from '@/features/calculators/mythic-summon/components/MythicSummonReference';
import {
  calculateConditionalGuaranteedValue,
  calculateExpectedValue,
  calculateGuaranteedDropValue,
} from '@/features/calculators/mythic-summon/drop-rates';
import {
  DIAMOND_RATES,
  GUARANTEED_WISHING_LILIES_PER_SUMMON,
  MILESTONES,
  MYTHIC_LUMINARY_SHARD_RATES,
  SUBSTITUTE_DOLL_FRAGMENT_RATES,
  WISHING_LILY_BONUS_MAX,
  WISHING_LILY_BONUS_MIN,
  WISHING_LILY_RATES,
} from '@/features/calculators/mythic-summon/mythic-summon-data';
import {
  calculateGuaranteedPulls,
  calculateMilestoneRewards,
  calculateRegularPulls,
  computePityTriggerProbability,
  findSummonsForTarget,
  simulateOnce,
  type SimResult,
} from '@/features/calculators/mythic-summon/mythic-summon-model';
import StatCard from '@/components/ui/StatCard';
import { StaticSurface } from '@/components/ui/Surface';
import { parseNumberInput } from '@/utils';
import ResourceBadge from '@/components/ui/ResourceBadge';
import { useGradientAccent, useIsMobile, useNullableNumber } from '@/hooks';
import {
  Alert,
  Badge,
  Button,
  Container,
  Divider,
  Group,
  NumberInput,
  ScrollArea,
  SimpleGrid,
  Stack,
  Switch,
  Table,
  Text,
  Title,
} from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import {
  IoDiamond,
  IoFlag,
  IoInformationCircleOutline,
  IoSparkles,
  IoStar,
} from 'react-icons/io5';
import { PAGE_WIDTH } from '@/constants/ui';

export default function MythicSummonCalculatorPage() {
  const { accent } = useGradientAccent();
  const isMobile = useIsMobile();
  const [numSummons, safeNumSummons, setNumSummons] = useNullableNumber(100);
  const [currentPulls, safeCurrentPulls, setCurrentPulls] =
    useNullableNumber(0);
  const [conditionalPity, setConditionalPity] = useState(false);
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  const handleSimulate = useCallback(() => {
    setSimResult(
      simulateOnce({
        currentPulls: safeCurrentPulls,
        numSummons: safeNumSummons,
        conditionalPity,
        shardRates: MYTHIC_LUMINARY_SHARD_RATES,
        wishingLilyRates: WISHING_LILY_RATES,
        substituteDollRates: SUBSTITUTE_DOLL_FRAGMENT_RATES,
        diamondRates: DIAMOND_RATES,
        milestones: MILESTONES,
        wishingLilyBonusMin: WISHING_LILY_BONUS_MIN,
        wishingLilyBonusMax: WISHING_LILY_BONUS_MAX,
      }),
    );
  }, [safeCurrentPulls, safeNumSummons, conditionalPity]);

  const [targetShards, setTargetShards] = useState<number | null>(null);
  const [targetWishingLilies, setTargetWishingLilies] = useState<number | null>(
    null,
  );
  const [targetSubstituteDolls, setTargetSubstituteDolls] = useState<
    number | null
  >(null);
  const [targetDiamonds, setTargetDiamonds] = useState<number | null>(null);

  const results = useMemo(() => {
    if (safeNumSummons < 1) {
      return {
        mythicShards: 0,
        wishingLilies: 0,
        wishingLiliesFromRates: 0,
        wishingLiliesBonus: 0,
        substituteDollFragments: 0,
        diamonds: 0,
        milestoneShards: 0,
        totalMythicShards: 0,
        totalPulls: safeCurrentPulls,
        nextGuaranteedPull: 0,
      };
    }

    const totalPulls = safeCurrentPulls + safeNumSummons;
    const nextGuaranteedPull = 5 - (totalPulls % 5 || 5);

    // Calculate mythic shards with 5th pull mechanic.
    // In conditional pity mode, the guarantee only fires if the first 4 pulls
    // in that group of 5 all missed (P(pity) = (1-0.40)^4 ≈ 12.96%).
    const guaranteedMythicShardsValue = conditionalPity
      ? calculateConditionalGuaranteedValue(MYTHIC_LUMINARY_SHARD_RATES)
      : calculateGuaranteedDropValue(MYTHIC_LUMINARY_SHARD_RATES);

    // Count how many guaranteed pulls we get
    const guaranteedPulls = calculateGuaranteedPulls(
      safeCurrentPulls,
      safeNumSummons,
    );
    const regularPulls = calculateRegularPulls(
      safeCurrentPulls,
      safeNumSummons,
    );

    // Regular pulls have the normal drop rate
    const mythicShardsPerRegularSummon = calculateExpectedValue(
      MYTHIC_LUMINARY_SHARD_RATES,
    );

    // Guaranteed pulls have 100% chance to get a mythic shard drop
    const mythicShardsFromRegular = mythicShardsPerRegularSummon * regularPulls;
    const mythicShardsFromGuaranteed =
      guaranteedMythicShardsValue * guaranteedPulls;
    const mythicShards = mythicShardsFromRegular + mythicShardsFromGuaranteed;

    const milestoneShards = calculateMilestoneRewards(MILESTONES, totalPulls);
    const totalMythicShards = mythicShards + milestoneShards;

    const wishingLiliesPerSummon = calculateExpectedValue(WISHING_LILY_RATES);
    const substituteDollFragmentsPerSummon = calculateExpectedValue(
      SUBSTITUTE_DOLL_FRAGMENT_RATES,
    );
    const diamondsPerSummon = calculateExpectedValue(DIAMOND_RATES);

    // In conditional pity mode the 5th pull only "locks out" other resources
    // when pity fires (prob = (1-0.40)^4 ≈ 12.96%). The rest of the time it
    // acts like a regular pull and can drop everything normally.
    const pityTriggerProb = computePityTriggerProbability(
      MYTHIC_LUMINARY_SHARD_RATES,
      conditionalPity,
    );
    const effectiveRegularPulls =
      regularPulls + guaranteedPulls * (1 - pityTriggerProb);

    const wishingLiliesFromRates =
      wishingLiliesPerSummon * effectiveRegularPulls;
    const wishingLiliesBonus =
      GUARANTEED_WISHING_LILIES_PER_SUMMON * safeNumSummons;
    const totalWishingLilies = wishingLiliesFromRates + wishingLiliesBonus;

    return {
      mythicShards,
      wishingLilies: totalWishingLilies,
      wishingLiliesFromRates,
      wishingLiliesBonus,
      substituteDollFragments:
        substituteDollFragmentsPerSummon * effectiveRegularPulls,
      diamonds: diamondsPerSummon * effectiveRegularPulls,
      milestoneShards,
      totalMythicShards,
      totalPulls,
      nextGuaranteedPull,
    };
  }, [safeNumSummons, safeCurrentPulls, conditionalPity]);

  const nextMilestone = useMemo(() => {
    return MILESTONES.find((m) => m.summons > results.totalPulls);
  }, [results.totalPulls]);

  // Reverse calculator: how many summons are needed to reach each target?
  const reverseResults = useMemo(() => {
    const requiredSummons: Record<string, number | null> = {};

    const mythicShardPerRegular = calculateExpectedValue(
      MYTHIC_LUMINARY_SHARD_RATES,
    );
    const mythicShardPerGuaranteed = conditionalPity
      ? calculateConditionalGuaranteedValue(MYTHIC_LUMINARY_SHARD_RATES)
      : calculateGuaranteedDropValue(MYTHIC_LUMINARY_SHARD_RATES);
    const wishingLilyPerRegular = calculateExpectedValue(WISHING_LILY_RATES);
    const substituteDollsPerRegular = calculateExpectedValue(
      SUBSTITUTE_DOLL_FRAGMENT_RATES,
    );
    const diamondsPerRegular = calculateExpectedValue(DIAMOND_RATES);

    const pityTriggerProb = computePityTriggerProbability(
      MYTHIC_LUMINARY_SHARD_RATES,
      conditionalPity,
    );

    const getExpectedBySummons = (summons: number) => {
      const regularPulls = calculateRegularPulls(safeCurrentPulls, summons);
      const guaranteedPulls = summons - regularPulls;
      const effectiveRegularPulls =
        regularPulls + guaranteedPulls * (1 - pityTriggerProb);
      const milestoneBonus =
        calculateMilestoneRewards(MILESTONES, safeCurrentPulls + summons) -
        calculateMilestoneRewards(MILESTONES, safeCurrentPulls);

      return {
        mythicShards:
          mythicShardPerRegular * regularPulls +
          mythicShardPerGuaranteed * guaranteedPulls +
          milestoneBonus,
        wishingLilies:
          wishingLilyPerRegular * effectiveRegularPulls +
          GUARANTEED_WISHING_LILIES_PER_SUMMON * summons,
        substituteDolls: substituteDollsPerRegular * effectiveRegularPulls,
        diamonds: diamondsPerRegular * effectiveRegularPulls,
      };
    };

    if (targetShards && targetShards > 0) {
      requiredSummons['mythic_luminary_shard'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).mythicShards,
        targetShards,
      );
    }

    if (targetWishingLilies && targetWishingLilies > 0) {
      requiredSummons['wishing_lily'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).wishingLilies,
        targetWishingLilies,
      );
    }

    if (targetSubstituteDolls && targetSubstituteDolls > 0) {
      requiredSummons['6_star_substitute_doll_fragment'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).substituteDolls,
        targetSubstituteDolls,
      );
    }

    if (targetDiamonds && targetDiamonds > 0) {
      requiredSummons['diamond'] = findSummonsForTarget(
        (summons) => getExpectedBySummons(summons).diamonds,
        targetDiamonds,
      );
    }

    return requiredSummons;
  }, [
    targetShards,
    targetWishingLilies,
    targetSubstituteDolls,
    targetDiamonds,
    safeCurrentPulls,
    conditionalPity,
  ]);

  return (
    <Container size={PAGE_WIDTH.WIDE} py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <ListPageHeader
          title="Mythic Summon Calculator"
          description="Forecast summon outcomes and reverse-calculate required pulls for your goals."
        />

        <Alert
          variant="light"
          color={accent.primary}
          title="About this calculator"
          icon={<IoInformationCircleOutline />}
        >
          Calculate the average resource yield from Mythic Summons, including
          both drop rates and milestone rewards. Enter the number of summons to
          see expected returns.
        </Alert>

        <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="md">
            <Title order={2} size="h3">
              <Group gap="xs">
                <IoFlag />
                Target Resources
              </Group>
            </Title>

            <Text size="sm" c="dimmed">
              Enter target amounts to see how many summons you need.
            </Text>

            <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
              <NumberInput
                hideControls={isMobile}
                label="Target Mythic Luminary Shards"
                value={targetShards ?? ''}
                onChange={(val) => setTargetShards(parseNumberInput(val))}
                min={0}
                max={1000}
                placeholder="Leave empty to skip"
                size="sm"
              />
              <NumberInput
                hideControls={isMobile}
                label="Target Wishing Lilies"
                value={targetWishingLilies ?? ''}
                onChange={(val) =>
                  setTargetWishingLilies(parseNumberInput(val))
                }
                min={0}
                max={100000}
                placeholder="Leave empty to skip"
                size="sm"
              />
              <NumberInput
                hideControls={isMobile}
                label="Target Substitute Doll Fragments"
                value={targetSubstituteDolls ?? ''}
                onChange={(val) =>
                  setTargetSubstituteDolls(parseNumberInput(val))
                }
                min={0}
                max={10000}
                placeholder="Leave empty to skip"
                size="sm"
              />
              <NumberInput
                hideControls={isMobile}
                label="Target Diamonds"
                value={targetDiamonds ?? ''}
                onChange={(val) => setTargetDiamonds(parseNumberInput(val))}
                min={0}
                max={1000000}
                placeholder="Leave empty to skip"
                size="sm"
              />
            </SimpleGrid>

            {Object.entries(reverseResults).length > 0 && (
              <Stack gap="xs">
                {Object.entries(reverseResults).map(
                  ([resourceSlug, summons]) => (
                    <Alert
                      key={resourceSlug}
                      variant="light"
                      color={summons === null ? 'red' : accent.primary}
                      p="sm"
                    >
                      {summons === null ? (
                        <Text size="sm">
                          <ResourceBadge slug={resourceSlug} size="xs" /> target
                          isn&apos;t reachable within 1,000,000 summons
                        </Text>
                      ) : (
                        <Group justify="space-between" wrap="nowrap">
                          <Text size="sm">
                            <ResourceBadge slug={resourceSlug} size="xs" /> need{' '}
                            <strong>{summons}</strong> summons
                          </Text>
                          <Text size="xs" c="dimmed">
                            {safeCurrentPulls + summons} total
                          </Text>
                        </Group>
                      )}
                    </Alert>
                  ),
                )}
              </Stack>
            )}
          </Stack>
        </StaticSurface>

        <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="md">
            <Title order={2} size="h3">
              <Group gap="xs">
                <IoSparkles />
                Expected Projection
              </Group>
            </Title>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <NumberInput
                hideControls={isMobile}
                label="Current Pulls"
                description="How many pulls you've already done"
                value={currentPulls ?? ''}
                onChange={(val) => setCurrentPulls(parseNumberInput(val))}
                min={0}
                max={10000}
                placeholder="0"
                size="md"
              />
              <NumberInput
                hideControls={isMobile}
                label="Number of Summons"
                description="How many summons you plan to do"
                value={numSummons ?? ''}
                onChange={(val) => setNumSummons(parseNumberInput(val))}
                min={1}
                max={10000}
                placeholder="100"
                size="md"
                step={10}
                leftSection={<IoSparkles />}
              />
            </SimpleGrid>
            <Switch
              checked={conditionalPity}
              onChange={(e) => setConditionalPity(e.currentTarget.checked)}
              color={accent.primary}
              label="Conditional pity"
              description={
                conditionalPity
                  ? '5th pull only guarantees a shard if the first 4 all missed (P ≈ 12.96%)'
                  : '5th pull always guarantees a shard regardless of earlier pulls'
              }
              size="sm"
            />
            <Group gap="xs" wrap="wrap">
              <Text size="sm" c="dimmed">
                Total pulls: <strong>{results.totalPulls}</strong>
              </Text>
              <Text size="sm" c="dimmed" visibleFrom="sm">
                •
              </Text>
              <Text size="sm" className="dt-link-text">
                Next guaranteed mythic shard pull in:{' '}
                <strong>{results.nextGuaranteedPull}</strong> summon
                {results.nextGuaranteedPull !== 1 ? 's' : ''}
              </Text>
            </Group>
          </Stack>
        </StaticSurface>

        <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Stack gap={4}>
                <Title order={2} size="h3">
                  Expected Rewards
                </Title>
                <Text size="sm" c="dimmed">
                  Average rewards from your selected summons.
                </Text>
              </Stack>
              <Button
                variant="light"
                color={accent.primary}
                size="sm"
                onClick={handleSimulate}
                disabled={safeNumSummons < 1}
              >
                {simResult ? 'Re-simulate' : 'Simulate'}
              </Button>
            </Group>

            <SimpleGrid
              cols={{ base: 2, xl: 4 }}
              spacing={{ base: 'xs', sm: 'lg' }}
            >
              <StatCard
                icon={<IoStar />}
                title="Mythic Luminary Shards"
                value={results.totalMythicShards.toFixed(1)}
                color={accent.primary}
                subtitle={`${results.mythicShards.toFixed(1)} drops + ${results.milestoneShards} milestone`}
                resourceSlug={isMobile ? undefined : 'mythic_luminary_shard'}
                showIcon={false}
                showTitle={isMobile}
                showResourceQuantity={false}
              />
              <StatCard
                icon={<IoSparkles />}
                title="Wishing Lilies"
                value={results.wishingLilies.toFixed(1)}
                color="pink"
                subtitle={`${results.wishingLiliesFromRates.toFixed(1)} drops + ${results.wishingLiliesBonus.toFixed(0)} bonus`}
                resourceSlug={isMobile ? undefined : 'wishing_lily'}
                showIcon={false}
                showTitle={isMobile}
                showResourceQuantity={false}
              />
              <StatCard
                icon={<IoSparkles />}
                title="6-Star Substitute Doll Fragments"
                value={results.substituteDollFragments.toFixed(1)}
                color="cyan"
                subtitle="From regular-pull drop rates"
                resourceSlug={
                  isMobile ? undefined : '6_star_substitute_doll_fragment'
                }
                showIcon={false}
                showTitle={isMobile}
                showResourceQuantity={false}
              />
              <StatCard
                icon={<IoDiamond />}
                title="Diamonds"
                value={results.diamonds.toFixed(1)}
                color="yellow"
                subtitle="From regular-pull drop rates"
                resourceSlug={isMobile ? undefined : 'diamond'}
                showIcon={false}
                showTitle={isMobile}
                showResourceQuantity={false}
              />
            </SimpleGrid>

            {simResult && (
              <>
                <Divider
                  label="Simulation result (1 run)"
                  labelPosition="center"
                />
                <ScrollArea>
                  <Table withRowBorders={false} fz="sm" miw={380}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Resource</Table.Th>
                        <Table.Th ta="right">Expected</Table.Th>
                        <Table.Th ta="right">Simulated</Table.Th>
                        <Table.Th ta="right">Diff</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {[
                        {
                          slug: 'mythic_luminary_shard',
                          expected: results.totalMythicShards,
                          simulated: simResult.totalShards,
                        },
                        {
                          slug: 'wishing_lily',
                          expected: results.wishingLilies,
                          simulated: simResult.wishingLilies,
                        },
                        {
                          slug: '6_star_substitute_doll_fragment',
                          expected: results.substituteDollFragments,
                          simulated: simResult.substituteDolls,
                        },
                        {
                          slug: 'diamond',
                          expected: results.diamonds,
                          simulated: simResult.diamonds,
                        },
                      ].map(({ slug, expected, simulated }) => {
                        const diff = simulated - expected;
                        return (
                          <Table.Tr key={slug}>
                            <Table.Td>
                              <ResourceBadge slug={slug} size="xs" />
                            </Table.Td>
                            <Table.Td ta="right" c="dimmed">
                              {expected.toFixed(1)}
                            </Table.Td>
                            <Table.Td ta="right">
                              <strong>{simulated}</strong>
                            </Table.Td>
                            <Table.Td ta="right">
                              <Badge
                                size="sm"
                                variant="light"
                                color={diff >= 0 ? 'green' : 'red'}
                              >
                                {diff >= 0 ? '+' : ''}
                                {diff.toFixed(1)}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </>
            )}
          </Stack>
        </StaticSurface>

        {nextMilestone && (
          <Alert variant="light" color={accent.primary} icon={<IoStar />}>
            Next milestone: <strong>{nextMilestone.summons} summons</strong> for{' '}
            <strong>{nextMilestone.shards}</strong>{' '}
            <ResourceBadge
              slug="mythic_luminary_shard"
              quantity={nextMilestone.shards}
              size="xs"
            />{' '}
            ({nextMilestone.summons - results.totalPulls} more to go)
          </Alert>
        )}

        <Divider my="md" />

        <MythicSummonReference
          shardRates={MYTHIC_LUMINARY_SHARD_RATES}
          wishingLilyRates={WISHING_LILY_RATES}
          substituteDollRates={SUBSTITUTE_DOLL_FRAGMENT_RATES}
          diamondRates={DIAMOND_RATES}
          guaranteedWishingLilies={GUARANTEED_WISHING_LILIES_PER_SUMMON}
          milestones={MILESTONES}
          totalPulls={results.totalPulls}
          conditionalPity={conditionalPity}
          accentColor={accent.primary}
        />
      </Stack>
    </Container>
  );
}
