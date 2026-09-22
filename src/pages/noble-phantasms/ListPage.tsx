import { Container, Group, Stack, Tabs } from '@mantine/core';
import { useMemo } from 'react';
import ListPageHeader from '@/components/layout/ListPageHeader';
import ExportButton from '@/components/tools/ExportButton';
import DataCorrectionButton from '@/components/tools/DataCorrectionButton';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import NoblePhantasmCatalogTab from '@/features/wiki/noble-phantasms/components/NoblePhantasmCatalogTab';
import NoblePhantasmUsageTab from '@/features/wiki/noble-phantasms/components/NoblePhantasmUsageTab';
import { useNoblePhantasmCatalog } from '@/features/wiki/noble-phantasms/hooks/use-noble-phantasm-catalog';
import { useNoblePhantasmCharacterIndex } from '@/features/wiki/noble-phantasms/hooks/use-noble-phantasm-character-index';
import { useNoblePhantasmUsage } from '@/features/wiki/noble-phantasms/hooks/use-noble-phantasm-usage';
import {
  useNoblePhantasms,
  useStatusEffects,
} from '@/features/wiki/hooks/use-wiki-data';
import { useGradientAccent, useMobileTooltip, useTabParam } from '@/hooks';
import { getLatestTimestamp } from '@/utils';
import { retryFailedDataSources } from '@/utils/retry-failed-data-sources';

export default function NoblePhantasms() {
  const { accent } = useGradientAccent();
  const tooltipProps = useMobileTooltip();
  const [activeTab, handleTabChange] = useTabParam('tab', 'noble-phantasms', [
    'noble-phantasms',
    'usage',
  ]);
  const { data: noblePhantasms, loading, error, retry } = useNoblePhantasms();
  const {
    data: characters,
    loading: charactersLoading,
    error: charactersError,
    retry: retryCharacters,
  } = useCharacters();
  const { data: statusEffects } = useStatusEffects();
  const characterIndex = useNoblePhantasmCharacterIndex(characters);
  const catalog = useNoblePhantasmCatalog(
    noblePhantasms,
    characterIndex.byIdentity,
    characterIndex.names,
  );
  const usage = useNoblePhantasmUsage(
    noblePhantasms,
    characters,
    characterIndex.byIdentity,
    characterIndex.names,
  );
  const mostRecentUpdate = useMemo(
    () => getLatestTimestamp(noblePhantasms),
    [noblePhantasms],
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader title="Noble Phantasms" timestamp={mostRecentUpdate}>
          {activeTab !== 'usage' && (
            <Group gap="xs">
              <ExportButton
                data={noblePhantasms}
                filename="noble-phantasm.json"
              />
              <DataCorrectionButton entityType="noble phantasm" />
            </Group>
          )}
        </ListPageHeader>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="noble-phantasms">Noble Phantasms</Tabs.Tab>
            <Tabs.Tab value="usage">Usage</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="noble-phantasms" pt="md">
            <NoblePhantasmCatalogTab
              loading={loading}
              error={error}
              onRetry={retry}
              noblePhantasms={noblePhantasms}
              characterByIdentity={characterIndex.byIdentity}
              characterNames={characterIndex.names}
              statusEffects={statusEffects}
              accent={accent}
              catalog={catalog}
            />
          </Tabs.Panel>

          <Tabs.Panel value="usage" pt="md">
            <NoblePhantasmUsageTab
              loading={loading || charactersLoading}
              error={error || charactersError}
              onRetry={() =>
                retryFailedDataSources(
                  [error, retry],
                  [charactersError, retryCharacters],
                )
              }
              noblePhantasms={noblePhantasms}
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
