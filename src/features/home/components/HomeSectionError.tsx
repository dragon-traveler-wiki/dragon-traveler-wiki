import { Button, Group, Text } from '@mantine/core';
import { IoAlertCircleOutline, IoRefresh } from 'react-icons/io5';

interface HomeSectionErrorProps {
  message: string;
  onRetry: () => void;
}

export default function HomeSectionError({
  message,
  onRetry,
}: HomeSectionErrorProps) {
  return (
    <Group gap="xs" wrap="wrap" role="alert">
      <IoAlertCircleOutline color="var(--mantine-color-red-6)" />
      <Text size="sm" c="dimmed">
        {message}
      </Text>
      <Button
        size="compact-xs"
        variant="subtle"
        color="red"
        leftSection={<IoRefresh size={12} />}
        onClick={onRetry}
      >
        Retry
      </Button>
    </Group>
  );
}
