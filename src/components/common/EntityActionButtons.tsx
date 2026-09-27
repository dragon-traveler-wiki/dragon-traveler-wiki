import { Button, type ButtonProps } from '@mantine/core';
import type { MouseEvent } from 'react';
import { IoCreate, IoDownload, IoTrash } from 'react-icons/io5';
import { useGradientAccent } from '@/hooks';

type CompactSize =
  'compact-xs' | 'compact-sm' | 'compact-md' | 'compact-lg' | 'compact-xl';

interface EntityActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  isExporting?: boolean;
  editLabel?: string;
  deleteLabel?: string;
  exportLabel?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  stopPropagation?: boolean;
}

function getIconSize(size: ButtonProps['size']) {
  const compactSizes: CompactSize[] = [
    'compact-xs',
    'compact-sm',
    'compact-md',
    'compact-lg',
    'compact-xl',
  ];
  return compactSizes.includes((size || 'sm') as CompactSize) ? 12 : 16;
}

export default function EntityActionButtons({
  onEdit,
  onDelete,
  onExport,
  isExporting = false,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  exportLabel = 'Export Image',
  size = 'compact-xs',
  variant = 'subtle',
  stopPropagation = false,
}: EntityActionButtonsProps) {
  const { accent } = useGradientAccent();
  const iconSize = getIconSize(size);

  const withStopPropagation = (handler: () => void) => {
    if (!stopPropagation) return () => handler();
    return (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      handler();
    };
  };

  return (
    <>
      {onEdit && (
        <Button
          variant={variant}
          size={size}
          color={accent.primary}
          leftSection={<IoCreate size={iconSize} />}
          onClick={withStopPropagation(onEdit)}
        >
          {editLabel}
        </Button>
      )}

      {onExport && (
        <Button
          variant={variant}
          size={size}
          color={accent.secondary}
          leftSection={<IoDownload size={iconSize} />}
          loading={isExporting}
          onClick={withStopPropagation(onExport)}
        >
          {exportLabel}
        </Button>
      )}

      {onDelete && (
        <Button
          variant={variant}
          size={size}
          color="red"
          leftSection={<IoTrash size={iconSize} />}
          onClick={withStopPropagation(onDelete)}
        >
          {deleteLabel}
        </Button>
      )}
    </>
  );
}
