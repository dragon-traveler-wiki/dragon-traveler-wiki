import {
  Button,
  Container,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { IoArrowBack, IoSearch } from 'react-icons/io5';
import { Link } from 'react-router';
import { PAGE_WIDTH } from '@/constants/ui';

interface EntityNotFoundProps {
  entityType: string;
  name?: string;
  backLabel: string;
  backPath: string;
}

export default function EntityNotFound({
  entityType,
  name,
  backLabel,
  backPath,
}: EntityNotFoundProps) {
  return (
    <Container size={PAGE_WIDTH.NARROW} py={80}>
      <Stack align="center" gap="xl">
        <ThemeIcon size={80} radius="xl" variant="light" color="gray">
          <IoSearch size={36} />
        </ThemeIcon>
        <Stack align="center" gap="sm">
          <Title order={1} size="h2">
            {entityType} Not Found
          </Title>
          {name ? (
            <Text c="dimmed" ta="center" maw={400}>
              No {entityType.toLowerCase()} named{' '}
              <Text component="span" fw={600} c="default" inherit>
                "{name}"
              </Text>{' '}
              could be found.
            </Text>
          ) : (
            <Text c="dimmed" ta="center" maw={400}>
              This {entityType.toLowerCase()} could not be found.
            </Text>
          )}
          <Text size="sm" c="dimmed" ta="center">
            It may have been removed or the URL might be incorrect.
          </Text>
        </Stack>
        <Button
          component={Link}
          to={backPath}
          leftSection={<IoArrowBack size={16} />}
          variant="light"
        >
          {backLabel}
        </Button>
      </Stack>
    </Container>
  );
}
