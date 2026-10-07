import DataFetchError from '@/components/ui/DataFetchError';
import EmptyState from '@/components/ui/EmptyState';
import { useGradientAccent } from '@/hooks';
import type { ReactNode } from 'react';

interface ListPageShellProps {
  loading: boolean;
  error?: Error | null;
  onRetry: () => void;
  hasData: boolean;
  emptyMessage: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  errorTitle?: string;
  loadingFallback: ReactNode;
  children: ReactNode;
}

export default function ListPageShell({
  loading,
  error,
  onRetry,
  hasData,
  emptyMessage,
  emptyDescription,
  emptyIcon,
  errorTitle = 'Could not load data',
  loadingFallback,
  children,
}: ListPageShellProps) {
  const { accent } = useGradientAccent();

  if (loading) {
    return <>{loadingFallback}</>;
  }
  if (error) {
    return (
      <DataFetchError
        title={errorTitle}
        message={error.message}
        onRetry={onRetry}
      />
    );
  }
  if (!hasData) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyMessage}
        description={emptyDescription}
        color={accent.primary}
      />
    );
  }
  return <>{children}</>;
}
