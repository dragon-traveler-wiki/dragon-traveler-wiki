import SafeImage from '@/components/ui/SafeImage';
import {
  getWyrmIcon,
  getWyrmIllustration,
  getWyrmPortrait,
  type Illustration,
} from '@/assets';
import IllustrationPreviewCard from '@/components/common/IllustrationPreviewCard';
import IllustrationPreviewModal from '@/components/common/IllustrationPreviewModal';
import ChangeHistory from '@/components/common/ChangeHistory';
import DetailPageHero from '@/components/common/DetailPageHero';
import DetailPageNavigation from '@/components/common/DetailPageNavigation';
import LastUpdated from '@/components/common/LastUpdated';
import RichText from '@/components/common/RichText';
import { DetailPageLoading } from '@/components/layout/PageLoadingSkeleton';
import EntityNotFound from '@/components/ui/EntityNotFound';
import FactionTag from '@/components/ui/FactionTag';
import QualityIcon from '@/components/ui/QualityIcon';
import { QUALITY_COLOR } from '@/constants/quality';
import { getLoreGlassStyles } from '@/constants/glass';
import { getHeroIconBoxStyles } from '@/constants/detail-styles';
import { StaticSurface } from '@/components/ui/Surface';
import { BREAKPOINTS, IMAGE_SIZE } from '@/constants/ui';
import type { WyrmPhase } from '@/features/wiki/wyrms/types';
import { WYRM_PHASE_ORDER } from '@/features/wiki/wyrms/types';

const WYRM_PHASE_COLOR: Record<WyrmPhase, string> = {
  'Juvenile Phase': 'violet',
  'Growth Phase': 'yellow',
  'Final Phase': 'orange',
};
import EvolutionSection from '@/features/wiki/wyrms/components/EvolutionSection';
import SkillCard from '@/features/wiki/wyrms/components/SkillCard';
import StarUpgradesTable from '@/features/wiki/wyrms/components/StarUpgradesTable';
import {
  useStatusEffects,
  useWyrmChanges,
  useWyrms,
} from '@/features/wiki/hooks/use-wiki-data';
import { useDarkMode, useGradientAccent, useMobileTooltip } from '@/hooks';
import {
  findEntityByParam,
  shouldRedirectToEntitySlug,
} from '@/utils/entity-slug';
import {
  Badge,
  Box,
  Container,
  Grid,
  Group,
  SimpleGrid,
  Stack,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';

function phaseIndex(phase: WyrmPhase): number {
  return WYRM_PHASE_ORDER.indexOf(phase);
}

export default function WyrmPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { accent } = useGradientAccent();
  const isDark = useDarkMode();
  const isDesktop = useMediaQuery(BREAKPOINTS.DESKTOP);
  const tooltipProps = useMobileTooltip();
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: wyrms, loading } = useWyrms();
  const { data: statusEffects } = useStatusEffects();
  const { data: changesData } = useWyrmChanges();

  const wyrm = useMemo(
    () => findEntityByParam(wyrms, name, (w) => w.slug),
    [wyrms, name],
  );

  useEffect(() => {
    if (!wyrm || !name) return;
    if (!shouldRedirectToEntitySlug(name, wyrm.slug)) return;
    navigate(`/wyrms/${wyrm.slug}`, { replace: true });
  }, [wyrm, name, navigate]);

  const orderedWyrms = useMemo(
    () =>
      [...wyrms].sort((a, b) => {
        const fCmp = a.faction.localeCompare(b.faction);
        if (fCmp !== 0) return fCmp;
        return phaseIndex(a.phase) - phaseIndex(b.phase);
      }),
    [wyrms],
  );

  const wyrmIndex = useMemo(() => {
    if (!wyrm) return -1;
    return orderedWyrms.findIndex((w) => w.slug === wyrm.slug);
  }, [wyrm, orderedWyrms]);

  const previousWyrm = wyrmIndex > 0 ? orderedWyrms[wyrmIndex - 1] : null;
  const nextWyrm =
    wyrmIndex >= 0 && wyrmIndex < orderedWyrms.length - 1
      ? orderedWyrms[wyrmIndex + 1]
      : null;

  if (loading) {
    return <DetailPageLoading />;
  }

  if (!wyrm) {
    return (
      <EntityNotFound
        entityType="Wyrm"
        name={name}
        backLabel="Back to Wyrms"
        backPath="/wyrms"
      />
    );
  }

  const iconSrc = getWyrmPortrait(wyrm.slug);
  const illustrationSrc = getWyrmIllustration(wyrm.slug);
  const qualityColor = QUALITY_COLOR[wyrm.quality];
  const phaseColor = WYRM_PHASE_COLOR[wyrm.phase];
  const stickyTopOffset =
    'calc(var(--app-shell-header-offset, 0px) + var(--mantine-spacing-md))';

  return (
    <Box>
      <DetailPageHero
        isDark={isDark}
        qualityColor={qualityColor}
        secondaryColor={accent.secondary}
        breadcrumbItems={[
          { label: 'Wyrms', path: '/wyrms' },
          { label: wyrm.name },
        ]}
      >
        <Group gap="lg" align="flex-start" wrap="nowrap">
          {iconSrc && (
            <Box style={getHeroIconBoxStyles(isDark, qualityColor, true)}>
              <SafeImage
                src={iconSrc}
                alt={wyrm.name}
                w={IMAGE_SIZE.DETAIL_ICON}
                h={IMAGE_SIZE.DETAIL_ICON}
                fit="contain"
                radius="sm"
              />
            </Box>
          )}

          <Stack gap={6} style={{ flex: 1 }}>
            <Group gap="sm" align="center">
              <Title
                order={1}
                c={isDark ? 'white' : 'dark'}
                fz={{ base: '1.5rem', sm: '2.125rem' }}
                style={{ lineHeight: 1.2, wordBreak: 'break-word' }}
              >
                {wyrm.name}
              </Title>
              <QualityIcon quality={wyrm.quality} size={32} />
            </Group>
            <LastUpdated timestamp={wyrm.last_updated} />
            <Group gap="sm" mt={4}>
              <Badge size="lg" variant="light" color={phaseColor}>
                {wyrm.phase}
              </Badge>
              <FactionTag faction={wyrm.faction} size="md" />
            </Group>
          </Stack>
        </Group>

        {wyrm.description && (
          <StaticSurface p="md" style={getLoreGlassStyles(isDark)}>
            <Stack gap="xs">
              <RichText
                text={wyrm.description}
                statusEffects={statusEffects}
                italic
                lineHeight={1.6}
              />
              {wyrm.battle_description && (
                <RichText
                  text={wyrm.battle_description}
                  statusEffects={statusEffects}
                />
              )}
            </Stack>
          </StaticSurface>
        )}
      </DetailPageHero>

      <Container size="xl" py={{ base: 'lg', sm: 'xl' }}>
        <Grid gap="xl">
          {/* Left column — portrait + star upgrades */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack
              gap="md"
              style={{
                position: isDesktop ? 'sticky' : 'static',
                top: isDesktop ? stickyTopOffset : undefined,
                alignSelf: 'flex-start',
              }}
            >
              {illustrationSrc && (
                <>
                  <IllustrationPreviewCard
                    src={illustrationSrc}
                    name={wyrm.name}
                    accentColor={accent.primary}
                    onExpand={() => setPreviewOpen(true)}
                  />
                  <IllustrationPreviewModal
                    opened={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    entityName={wyrm.name}
                    illustrations={[
                      {
                        name: wyrm.name,
                        src: illustrationSrc,
                        type: 'image',
                      } satisfies Illustration,
                    ]}
                    tooltipProps={tooltipProps}
                  />
                </>
              )}

              <StarUpgradesTable wyrm={wyrm} statusEffects={statusEffects} />
            </Stack>
          </Grid.Col>

          {/* Right column — content */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="xl">
              <EvolutionSection wyrm={wyrm} allWyrms={wyrms} isDark={isDark} />

              {wyrm.skills.length > 0 && (
                <Stack gap="md">
                  <Title order={2} size="h3">
                    Skills
                  </Title>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                    {wyrm.skills.map((skill, i) => (
                      <SkillCard
                        key={`${skill.name}-${i}`}
                        wyrm={wyrm}
                        skill={skill}
                        statusEffects={statusEffects}
                      />
                    ))}
                  </SimpleGrid>
                </Stack>
              )}
            </Stack>
          </Grid.Col>
        </Grid>

        <ChangeHistory history={changesData[wyrm.slug]} />

        <DetailPageNavigation
          previousItem={
            previousWyrm
              ? {
                  label: previousWyrm.name,
                  path: `/wyrms/${previousWyrm.slug}`,
                  iconSrc: getWyrmIcon(previousWyrm.slug),
                }
              : null
          }
          nextItem={
            nextWyrm
              ? {
                  label: nextWyrm.name,
                  path: `/wyrms/${nextWyrm.slug}`,
                  iconSrc: getWyrmIcon(nextWyrm.slug),
                }
              : null
          }
        />
      </Container>
    </Box>
  );
}
