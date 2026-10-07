import { Text, Tooltip } from '@mantine/core';
import { formatExactDate, formatRelativeTime } from '@/utils';
import { useMobileTooltip } from '@/hooks';

export default function LastUpdated({ timestamp }: { timestamp?: number }) {
  const mobileTooltip = useMobileTooltip();
  if (timestamp === undefined) return null;
  const formatted = formatRelativeTime(timestamp);
  if (!formatted) return null;

  return (
    <Tooltip label={formatExactDate(timestamp)} {...mobileTooltip}>
      <Text size="xs" c="dimmed" w="fit-content">
        Updated {formatted}
      </Text>
    </Tooltip>
  );
}
