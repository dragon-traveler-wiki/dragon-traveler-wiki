import { Button } from '@mantine/core';
import type { ReactNode } from 'react';
import { IoCreate } from 'react-icons/io5';
import { useGradientAccent } from '@/hooks';
import EmptyState from './EmptyState';

interface NoSavedItemsStateProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  icon?: ReactNode;
}

export default function NoSavedItemsState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: NoSavedItemsStateProps) {
  const { accent } = useGradientAccent();

  return (
    <EmptyState
      icon={icon ?? <IoCreate size={32} />}
      title={title}
      description={description}
      color={accent.primary}
      action={
        <Button
          variant="light"
          color={accent.primary}
          size="sm"
          leftSection={<IoCreate size={16} />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      }
    />
  );
}
