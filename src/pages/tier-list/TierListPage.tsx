import {
  Badge,
  Button,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Title,
} from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { IoCreate, IoDownload } from 'react-icons/io5';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { TierListPageLoading } from '@/components/layout/PageLoadingSkeleton';
import CollapsibleSectionCard from '@/components/ui/CollapsibleSectionCard';
import ConfirmActionModal from '@/components/ui/ConfirmActionModal';
import EntityNotFound from '@/components/ui/EntityNotFound';
import { CHARACTER_GRID_SPACING, STORAGE_KEY } from '@/constants/ui';
import { useCharacterResolution } from '@/features/characters/hooks/use-character-resolution';
import { useCharacters } from '@/features/characters/hooks/use-characters-data';
import { getCharacterIdentityKey } from '@/features/characters/utils/character-route';
import { toBuilderDraft } from '@/features/community/builder-edit';
import CommunityActions from '@/features/community/CommunityActions';
import RevisionHistory from '@/features/community/RevisionHistory';
import ReferenceTierListToggle from '@/features/tier-list/components/ReferenceTierListToggle';
import TierListContent from '@/features/tier-list/components/TierListContent';
import TierListEntityCard from '@/features/tier-list/components/TierListEntityCard';
import { useTierList } from '@/features/tier-list/hooks/use-tier-list-data';
import { useResolveTierEntryEntity } from '@/features/tier-list/hooks/use-resolve-tier-entry-entity';
import {
  getTierListEntityType,
  type TierListRankableEntity,
} from '@/features/tier-list/types';
import { getTierListRoutePath } from '@/features/tier-list/utils/tier-list-route';
import { useNoblePhantasms } from '@/features/wiki/hooks/use-wiki-data';
import { useDarkMode, useGradientAccent } from '@/hooks';
import { downloadElementAsImage } from '@/utils/export-image';

export default function TierListPage() {
  const { tierListId, tierListSlug } = useParams<{
    tierListId: string;
    tierListSlug: string;
  }>();
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();
  const navigate = useNavigate();
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const { data: tierList, loading: loadingTierList } = useTierList(
    tierListId ?? null,
  );
  const { data: characters, loading: loadingChars } = useCharacters();
  const { data: noblePhantasms, loading: loadingNoblePhantasms } =
    useNoblePhantasms();
  const loading = loadingTierList || loadingChars || loadingNoblePhantasms;

  const { preferredByName: charMap, byIdentity: characterByIdentity } =
    useCharacterResolution(characters);
  const resolveTierEntryEntity = useResolveTierEntryEntity(
    charMap,
    characterByIdentity,
    noblePhantasms,
  );

  useEffect(() => {
    if (!tierList || !tierListSlug) return;
    const canonicalPath = getTierListRoutePath(tierList);
    if (canonicalPath.endsWith(`/${tierListSlug}`)) return;
    navigate(canonicalPath, { replace: true });
  }, [navigate, tierList, tierListSlug]);

  if (loading) {
    return <TierListPageLoading />;
  }

  if (!tierList) {
    return (
      <EntityNotFound
        entityType="Tier list"
        name={tierListSlug}
        backLabel="Back to Tier List"
        backPath="/tier-list"
      />
    );
  }

  const openEditInBuilder = () => {
    navigate('/tier-list', {
      state: { editTierList: toBuilderDraft(tierList) },
    });
  };

  const requestEdit = () => {
    if (
      typeof window !== 'undefined' &&
      window.localStorage.getItem(STORAGE_KEY.TIER_LIST_BUILDER_DRAFT)
    ) {
      setConfirmEditOpen(true);
      return;
    }
    openEditInBuilder();
  };

  const exportAsImage = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    try {
      await downloadElementAsImage(exportRef.current, tierList.name, isDark);
    } finally {
      setExporting(false);
    }
  };

  const entityType = getTierListEntityType(tierList);
  const rankedKeys = new Set(
    tierList.entries.flatMap((entry) => {
      const entity = resolveTierEntryEntity(entry);
      return entity ? [entity.key] : [];
    }),
  );
  const availableEntities: TierListRankableEntity[] =
    entityType === 'noble_phantasm'
      ? noblePhantasms.map((noblePhantasm) => ({
          key: noblePhantasm.slug,
          entityType: 'noble_phantasm',
          noblePhantasm,
        }))
      : characters.map((character) => ({
          key: getCharacterIdentityKey(character),
          entityType: 'character',
          character,
        }));
  const unranked = availableEntities.filter(
    (entity) => !rankedKeys.has(entity.key),
  );

  const headerActions = (
    <Group gap="xs">
      <Button
        variant="light"
        color={accent.primary}
        leftSection={<IoCreate size={14} />}
        onClick={requestEdit}
      >
        {tierList.community?.viewerOwns ? 'Edit' : 'Remix'}
      </Button>
      <Button
        variant="light"
        leftSection={<IoDownload size={14} />}
        loading={exporting}
        onClick={exportAsImage}
      >
        Export Image
      </Button>
      {tierList.community && (
        <CommunityActions
          community={tierList.community}
          show={{ delete: true }}
          size="md"
          onDeleted={() => navigate('/tier-list')}
        />
      )}
    </Group>
  );

  return (
    <Container size="lg" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap">
          <Breadcrumbs
            items={[
              { label: 'Tier List', path: '/tier-list' },
              { label: tierList.name || 'Untitled' },
            ]}
          />
          {headerActions}
        </Group>
        <Title order={1}>{tierList.name || 'Untitled'}</Title>

        <ConfirmActionModal
          opened={confirmEditOpen}
          onCancel={() => setConfirmEditOpen(false)}
          title="Replace current builder data?"
          message="Opening this tier list will replace your current builder draft."
          confirmLabel="Replace"
          onConfirm={() => {
            setConfirmEditOpen(false);
            openEditInBuilder();
          }}
        />

        <Stack gap="md">
          <TierListContent
            tierList={tierList}
            resolveTierEntryEntity={resolveTierEntryEntity}
            viewMode="grid"
            bylineActions={
              tierList.community && (
                <CommunityActions
                  community={tierList.community}
                  show={{ reactions: true }}
                  trailing={<ReferenceTierListToggle tierList={tierList} />}
                />
              )
            }
            disableNameClamp={exporting}
            exportRefCallback={(node) => {
              exportRef.current = node;
            }}
          />

          {unranked.length > 0 && (
            <CollapsibleSectionCard
              defaultExpanded={false}
              color="gray"
              header={
                <Badge variant="filled" color="gray" size="lg" radius="sm">
                  N/A ({unranked.length})
                </Badge>
              }
            >
              <SimpleGrid
                cols={{ base: 2, xs: 3, sm: 4, md: 6 }}
                spacing={CHARACTER_GRID_SPACING}
              >
                {unranked.map((entity) => (
                  <TierListEntityCard
                    key={entity.key}
                    entity={entity}
                    fallbackName={entity.key}
                  />
                ))}
              </SimpleGrid>
            </CollapsibleSectionCard>
          )}
          {tierList.community && (
            <RevisionHistory
              kind="tier_list"
              id={tierList.community.id}
              publishedAt={tierList.community.createdAt}
            />
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
