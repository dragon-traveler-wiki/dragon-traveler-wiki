import { ActionIcon, Divider, Group, Select, Text } from '@mantine/core';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Scroll the page to the top after changing page. Default: false. */
  scrollToTop?: boolean;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
}

export default function PaginationControl({
  currentPage,
  totalPages,
  onChange,
  scrollToTop = false,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: PaginationControlProps) {
  const hasItems = totalItems === undefined ? totalPages > 0 : totalItems > 0;
  const hasPagination = totalPages > 1;
  const hasPageSizeSelector =
    hasItems &&
    pageSize !== undefined &&
    pageSizeOptions !== undefined &&
    pageSizeOptions.length > 1 &&
    onPageSizeChange !== undefined;
  const hasItemsCount =
    totalItems !== undefined && totalItems > 0 && pageSize !== undefined;
  const rangeStart = hasItemsCount ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd = hasItemsCount
    ? Math.min(totalItems, currentPage * pageSize)
    : 0;

  const fitsOnOnePage =
    totalItems !== undefined &&
    pageSizeOptions !== undefined &&
    pageSizeOptions.length > 0 &&
    totalItems <= Math.min(...pageSizeOptions);

  if (!hasItems || fitsOnOnePage || (!hasPagination && !hasPageSizeSelector))
    return null;

  const summaryText = hasItemsCount
    ? `${rangeStart}–${rangeEnd} of ${totalItems}`
    : `Page ${currentPage} of ${totalPages}`;

  const pageNumberData = Array.from({ length: totalPages }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  const pageSizeData = (pageSizeOptions ?? []).map((n) => ({
    value: String(n),
    label: `${n} / page`,
  }));

  function handleChange(page: number) {
    if (page === currentPage) return;
    onChange(page);
    if (scrollToTop) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const selectProps = {
    allowDeselect: false as const,
    size: 'sm' as const,
    radius: 'md' as const,
    comboboxProps: { position: 'bottom-end' as const },
    styles: { input: { fontWeight: 600 } },
  };

  const actionIconProps = {
    variant: 'subtle' as const,
    color: 'gray' as const,
    size: 'lg' as const,
    radius: 'md' as const,
  };

  return (
    <nav aria-label="Pagination navigation">
      <Group justify="space-between" align="center" wrap="wrap" gap="xs">
        <Text size="sm" c="dimmed">
          {summaryText}
        </Text>

        <Group gap={6} align="center" wrap="nowrap">
          {hasPagination && (
            <Group gap={4} align="center" wrap="nowrap">
              <ActionIcon
                {...actionIconProps}
                onClick={() => handleChange(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                <IoChevronBack size={16} />
              </ActionIcon>

              <Select
                {...selectProps}
                aria-label="Page number"
                value={String(currentPage)}
                data={pageNumberData}
                onChange={(value) => value && handleChange(Number(value))}
                searchable={totalPages > 12}
                w={64}
                styles={{ input: { fontWeight: 600, textAlign: 'center' } }}
              />

              <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                of {totalPages}
              </Text>

              <ActionIcon
                {...actionIconProps}
                onClick={() => handleChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
              >
                <IoChevronForward size={16} />
              </ActionIcon>
            </Group>
          )}

          {hasPagination && hasPageSizeSelector && (
            <Divider
              orientation="vertical"
              h={20}
              style={{ alignSelf: 'center' }}
            />
          )}

          {hasPageSizeSelector && (
            <Select
              {...selectProps}
              aria-label="Items per page"
              value={pageSize === undefined ? null : String(pageSize)}
              data={pageSizeData}
              onChange={(value) => value && onPageSizeChange?.(Number(value))}
              w={112}
            />
          )}
        </Group>
      </Group>
    </nav>
  );
}
