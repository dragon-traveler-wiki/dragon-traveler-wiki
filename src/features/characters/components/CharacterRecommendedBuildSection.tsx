import { useState } from 'react';
import { Group, Stack, Text, Title } from '@mantine/core';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import type {
  RecommendedGearLoadoutData,
  RecommendedSubclassEntry,
} from '@/features/characters/types';
import type { NoblePhantasm } from '@/features/wiki/noble-phantasms/types';
import type { StatusEffect } from '@/features/wiki/status-effects/types';
import { useGradientAccent } from '@/hooks';
import RecommendedNoblePhantasms from '@/features/characters/components/recommended-build/RecommendedNoblePhantasms';
import RecommendedSubclasses from '@/features/characters/components/recommended-build/RecommendedSubclasses';
import RecommendedGearLoadout from '@/features/characters/components/recommended-build/RecommendedGearLoadout';
import ActivatedSetBonuses from '@/features/characters/components/recommended-build/ActivatedSetBonuses';

interface CharacterRecommendedBuildSectionProps {
  recommendedGearLoadouts: RecommendedGearLoadoutData[];
  recommendedSubclassEntries: RecommendedSubclassEntry[];
  linkedNoblePhantasms: NoblePhantasm[];
  statusEffects: StatusEffect[];
}

export default function CharacterRecommendedBuildSection({
  recommendedGearLoadouts,
  recommendedSubclassEntries,
  linkedNoblePhantasms,
  statusEffects,
}: CharacterRecommendedBuildSectionProps) {
  const { accent } = useGradientAccent();
  const [selectedLoadoutIndex, setSelectedLoadoutIndex] = useState(0);

  const activeLoadout =
    recommendedGearLoadouts[selectedLoadoutIndex] ?? recommendedGearLoadouts[0];
  const activatedSetBonuses = activeLoadout?.activatedSetBonuses ?? [];

  if (
    recommendedGearLoadouts.length === 0 &&
    recommendedSubclassEntries.length === 0 &&
    linkedNoblePhantasms.length === 0
  ) {
    return null;
  }

  return (
    <CollapsibleSectionCard
      id="build-section"
      color={accent.primary}
      header={
        <Group align="flex-start" gap="sm">
          <Stack gap={2}>
            <Title order={2} size="h3">
              Recommended Build
            </Title>
            <Text size="sm" c="dimmed">
              Suggested setup based on current character data.
            </Text>
          </Stack>
        </Group>
      }
    >
      <Stack gap="md">
        {linkedNoblePhantasms.length > 0 && (
          <RecommendedNoblePhantasms
            linkedNoblePhantasms={linkedNoblePhantasms}
            statusEffects={statusEffects}
          />
        )}

        {recommendedSubclassEntries.length > 0 && (
          <RecommendedSubclasses
            recommendedSubclassEntries={recommendedSubclassEntries}
            statusEffects={statusEffects}
          />
        )}

        {recommendedGearLoadouts.length > 0 && (
          <RecommendedGearLoadout
            recommendedGearLoadouts={recommendedGearLoadouts}
            selectedLoadoutIndex={selectedLoadoutIndex}
            onSelectLoadoutIndex={setSelectedLoadoutIndex}
            statusEffects={statusEffects}
          />
        )}

        {activatedSetBonuses.length > 0 && (
          <ActivatedSetBonuses
            activatedSetBonuses={activatedSetBonuses}
            statusEffects={statusEffects}
          />
        )}
      </Stack>
    </CollapsibleSectionCard>
  );
}
