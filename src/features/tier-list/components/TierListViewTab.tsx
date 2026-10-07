import {
  Badge,
  Group,
  ScrollArea,
  SimpleGrid,
  Table,
  Text,
} from '@mantine/core';
import { Link, useNavigate } from 'react-router';
import AuthorLink from '@/features/community/AuthorLink';
import CommunityActions from '@/features/community/CommunityActions';
import NoResultsSuggestions from '@/components/ui/NoResultsSuggestions';
import CommunityLoadMore from '@/features/community/CommunityLoadMore';
import PaginationControl from '@/components/ui/PaginationControl';
import {
  getContentTypeColor,
  normalizeContentType,
} from '@/constants/content-types';
import { CURSOR_POINTER_STYLE, getMinWidthStyle } from '@/constants/styles';
import type { Character } from '@/features/characters/types';
import TierListCard from '@/features/tier-list/components/TierListCard';
import {
  getTierListEntityType,
  type TierList as TierListType,
} from '@/features/tier-list/types';
import { getTierListRoutePath } from '@/features/tier-list/utils/tier-list-route';
import { useGradientAccent } from '@/hooks';

interface TierListViewTabProps {
  paginatedTierLists: TierListType[];
  filteredTierLists: TierListType[];
  charMap: Map<string, Character>;
  characterByIdentity: Map<string, Character>;
  viewMode: string;
  search: string;
  onClearFilters: () => void;
  onOpenFilters: () => void;
  onRequestEdit: (tierList: TierListType) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (pageSize: number) => void;
  hasMore: boolean;
  loadedCount: number;
  paginationTotal: number;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export default function TierListViewTab({
  paginatedTierLists,
  filteredTierLists,
  charMap,
  characterByIdentity,
  viewMode,
  search,
  onClearFilters,
  onOpenFilters,
  onRequestEdit,
  page,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  hasMore,
  loadedCount,
  paginationTotal,
  loadingMore,
  onLoadMore,
}: TierListViewTabProps) {
  const { accent } = useGradientAccent();
  const navigate = useNavigate();

  return (
    <>
      {filteredTierLists.length === 0 && (
        <NoResultsSuggestions
          title={search ? 'No tier lists found' : 'No matching tier lists'}
          message={
            search
              ? 'No tier lists match your search.'
              : 'No tier lists match the current filters.'
          }
          onReset={onClearFilters}
          onOpenFilters={onOpenFilters}
        />
      )}

      {viewMode === 'grid' ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {paginatedTierLists.map((tierList) => (
            <TierListCard
              key={tierList.community?.id ?? tierList.name}
              tierList={tierList}
              charMap={charMap}
              characterByIdentity={characterByIdentity}
              to={getTierListRoutePath(tierList)}
              actions={
                tierList.community ? (
                  <CommunityActions
                    community={tierList.community}
                    onEdit={() => onRequestEdit(tierList)}
                    onDeleted={() => window.location.reload()}
                  />
                ) : null
              }
            />
          ))}
        </SimpleGrid>
      ) : (
        <ScrollArea type="auto" scrollbarSize={6} offsetScrollbars>
          <Table striped highlightOnHover style={getMinWidthStyle(560)}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Content Type</Table.Th>
                <Table.Th>Ranks</Table.Th>
                <Table.Th>Author</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedTierLists.map((tierList) => (
                <Table.Tr
                  key={tierList.community?.id ?? tierList.name}
                  style={CURSOR_POINTER_STYLE}
                  onClick={() => navigate(getTierListRoutePath(tierList))}
                >
                  <Table.Td>
                    <Text
                      component={Link}
                      to={getTierListRoutePath(tierList)}
                      size="sm"
                      fw={500}
                      className="dt-link-text"
                      style={{ textDecoration: 'none' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tierList.name || 'Untitled'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      variant="light"
                      size="sm"
                      color={getContentTypeColor(tierList.content_type, 'All')}
                    >
                      {normalizeContentType(tierList.content_type, 'All')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="outline" size="sm" color={accent.primary}>
                      {getTierListEntityType(tierList) === 'noble_phantasm'
                        ? 'Noble Phantasms'
                        : 'Characters'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <AuthorLink
                      author={tierList.community?.author}
                      fallback={tierList.author}
                      size="sm"
                      fw={400}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      {tierList.community && (
                        <CommunityActions
                          community={tierList.community}
                          onEdit={() => onRequestEdit(tierList)}
                          onDeleted={() => window.location.reload()}
                        />
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      <PaginationControl
        currentPage={page}
        totalPages={totalPages}
        onChange={onPageChange}
        totalItems={paginationTotal}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={onPageSizeChange}
      />

      <CommunityLoadMore
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
        atLastPage={page * pageSize >= filteredTierLists.length}
        loadedCount={loadedCount}
      />
    </>
  );
}
