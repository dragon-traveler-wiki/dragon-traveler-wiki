import { Anchor, Badge, Container, Group, Stack, Text } from '@mantine/core';
import type { IconType } from 'react-icons';
import { FaDiscord } from 'react-icons/fa';
import { IoBookOutline, IoLinkOutline } from 'react-icons/io5';
import { SiGooglesheets } from 'react-icons/si';
import {
  ListPageHeader,
  ListPageShell,
  SuggestModal,
  type FieldDef,
} from '@/components';
import { ViewModeLoading } from '@/components/layout/PageLoadingSkeleton';
import { StaticSurface } from '@/components/ui/Surface';
import { getStableTagColor } from '@/constants/tag-colors';
import { useUsefulLinks } from '@/features/wiki/hooks/use-wiki-data';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { toEntitySlug } from '@/utils/entity-slug';

const LINK_FIELDS: FieldDef[] = [
  {
    name: 'icon',
    label: 'Icon',
    type: 'select',
    options: ['discord', 'wiki', 'spreadsheet'],
  },
  {
    name: 'application',
    label: 'Application',
    type: 'text',
    required: true,
    placeholder: 'e.g. Discord, Google Sheets, Website',
  },
  {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
    placeholder: 'Link name',
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    placeholder: 'Brief description',
  },
  {
    name: 'link',
    label: 'URL',
    type: 'url',
    required: true,
    placeholder: 'https://example.com',
  },
];

const ICON_MAP: Record<string, IconType> = {
  discord: FaDiscord,
  wiki: IoBookOutline,
  spreadsheet: SiGooglesheets,
};

export default function UsefulLinks() {
  const { hash } = useLocation();
  const { data: links, loading, error, retry } = useUsefulLinks();

  useEffect(() => {
    if (!hash || links.length === 0) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' });
  }, [hash, links]);

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="md">
        <ListPageHeader
          title="Useful Links"
          description="Curated official and community resources for guides, tools, and reference material."
        >
          <SuggestModal
            buttonLabel="Suggest a Link"
            modalTitle="Suggest a New Link"
            issueTitle="[Link] New link suggestion"
            fields={LINK_FIELDS}
          />
        </ListPageHeader>

        <ListPageShell
          loading={loading}
          error={error}
          onRetry={retry}
          errorTitle="Could not load useful links"
          hasData={links.length > 0}
          emptyMessage="No useful links available yet."
          loadingFallback={<ViewModeLoading viewMode="list" />}
        >
          {links.map((link) => {
            const Icon = ICON_MAP[link.icon] ?? IoLinkOutline;
            return (
              <StaticSurface
                key={link.link}
                id={toEntitySlug(link.name)}
                p={{ base: 'sm', sm: 'lg' }}
              >
                <Group gap="xs" mb={4} wrap="nowrap" align="center">
                  <Icon size={18} aria-hidden style={{ flexShrink: 0 }} />
                  <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                    <Anchor
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      fw={600}
                    >
                      {link.name}
                    </Anchor>
                    <Badge
                      variant="light"
                      size="sm"
                      color={getStableTagColor(link.application)}
                    >
                      {link.application}
                    </Badge>
                  </Group>
                </Group>
                <Text size="sm" c="dimmed">
                  {link.description}
                </Text>
              </StaticSurface>
            );
          })}
        </ListPageShell>
      </Stack>
    </Container>
  );
}
