import { Box, Group, Paper, Text } from '@mantine/core';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { Link } from 'react-router';
import SafeImage from '@/components/ui/SafeImage';

type DetailNavigationItem = {
  label: string;
  path: string;
  iconSrc?: string;
};

interface DetailPageNavigationProps {
  previousItem?: DetailNavigationItem | null;
  nextItem?: DetailNavigationItem | null;
}

export default function DetailPageNavigation({
  previousItem,
  nextItem,
}: DetailPageNavigationProps) {
  if (!previousItem && !nextItem) return null;

  return (
    <Box mt="xl">
      <Group justify="space-between" align="stretch" wrap="wrap" gap="sm">
        {previousItem ? (
          <Link
            to={previousItem.path}
            style={{ textDecoration: 'none', flex: '1 1 220px' }}
          >
            <Paper
              withBorder
              p="sm"
              radius="md"
              style={{ minHeight: 48, display: 'flex', alignItems: 'center' }}
            >
              <Group gap="xs" className="dt-link-text">
                <IoChevronBack />
                {previousItem.iconSrc && (
                  <SafeImage
                    src={previousItem.iconSrc}
                    alt=""
                    w={28}
                    h={28}
                    fit="contain"
                    loading="lazy"
                  />
                )}
                <Text size="sm">Previous: {previousItem.label}</Text>
              </Group>
            </Paper>
          </Link>
        ) : (
          <Box style={{ flex: '1 1 220px' }} />
        )}

        {nextItem ? (
          <Link
            to={nextItem.path}
            style={{ textDecoration: 'none', flex: '1 1 220px' }}
          >
            <Paper
              withBorder
              p="sm"
              radius="md"
              style={{
                minHeight: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <Group gap="xs" className="dt-link-text">
                <Text size="sm">Next: {nextItem.label}</Text>
                {nextItem.iconSrc && (
                  <SafeImage
                    src={nextItem.iconSrc}
                    alt=""
                    w={28}
                    h={28}
                    fit="contain"
                    loading="lazy"
                  />
                )}
                <IoChevronForward />
              </Group>
            </Paper>
          </Link>
        ) : (
          <Box style={{ flex: '1 1 220px' }} />
        )}
      </Group>
    </Box>
  );
}
