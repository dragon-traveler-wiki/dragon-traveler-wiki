import LastUpdated from '@/components/common/LastUpdated';
import { Group, Stack, Text, Title } from '@mantine/core';
import type { ReactNode } from 'react';

interface ListPageHeaderProps {
  title: string;
  timestamp?: number | null;
  /** Optional subtitle shown under the title */
  description?: ReactNode;
  /** Right-side content, typically a SuggestModal */
  children?: ReactNode;
}

export default function ListPageHeader({
  title,
  timestamp,
  description,
  children,
}: ListPageHeaderProps) {
  const header = (
    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
      <Group gap="sm" align="baseline">
        <Title
          order={1}
          fz={{ base: '1.5rem', sm: '2.125rem' }}
          style={{ wordBreak: 'break-word' }}
        >
          {title}
        </Title>
        {timestamp != null && <LastUpdated timestamp={timestamp} />}
      </Group>
      {children}
    </Group>
  );

  if (!description) return header;

  return (
    <Stack gap={4}>
      {header}
      <Text c="dimmed" size="sm">
        {description}
      </Text>
    </Stack>
  );
}
