import { Container, Group, Stack, Tabs } from '@mantine/core';
import { useMemo } from 'react';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ExportButton from '@/components/tools/ExportButton';
import DataCorrectionButton from '@/components/tools/DataCorrectionButton';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import SubclassCatalogTab from '@/features/wiki/subclasses/components/SubclassCatalogTab';
import SubclassUsageTab from '@/features/wiki/subclasses/components/SubclassUsageTab';
import { useSubclassCatalog } from '@/features/wiki/subclasses/hooks/use-subclass-catalog';
import { useSubclassUsage } from '@/features/wiki/subclasses/hooks/use-subclass-usage';
import {
  useStatusEffects,
  useSubclasses,
} from '@/features/wiki/hooks/use-wiki-data';
import { useGradientAccent, useMobileTooltip, useTabParam } from '@/hooks';
import { getLatestTimestamp } from '@/utils';
import { retryFailedDataSources } from '@/utils/retry-failed-data-sources';

export default function Subclasses() {
  const { accent } = useGradientAccent();
  const tooltipProps = useMobileTooltip();
  const [activeTab, handleTabChange] = useTabParam('tab', 'subclasses', [
    'subclasses',
    'usage',
  ]);
  const { data: subclasses, loading, error, retry } = useSubclasses();
  const {
    data: characters,
    loading: charactersLoading,
    error: charactersError,
    retry: retryCharacters,
  } = useCharacters();
  const { data: statusEffects } = useStatusEffects();
  const catalog = useSubclassCatalog(subclasses);
  const usage = useSubclassUsage(subclasses, characters);
  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(subclasses),
    [subclasses],
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Subclasses" timestamp={mostRecentUpdate}>
          {activeTab !== 'usage' && (
            <Group gap="xs">
              <ExportButton data={subclasses} filename="subclasses.json" />
              <DataCorrectionButton entityType="subclass" />
            </Group>
          )}
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="subclasses">Subclasses</Tabs.Tab>
            <Tabs.Tab value="usage">Usage</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="subclasses" pt="md">
            <SubclassCatalogTab
              loading={loading}
              error={error}
              onRetry={retry}
              subclasses={subclasses}
              statusEffects={statusEffects}
              accent={accent}
              catalog={catalog}
            />
          </Tabs.Panel>

          <Tabs.Panel value="usage" pt="md">
            <SubclassUsageTab
              loading={loading || charactersLoading}
              error={error || charactersError}
              onRetry={() =>
                retryFailedDataSources(
                  [error, retry],
                  [charactersError, retryCharacters],
                )
              }
              subclasses={subclasses}
              usage={usage}
              accent={accent}
              tooltipProps={tooltipProps}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
