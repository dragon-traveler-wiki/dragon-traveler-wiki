import {
  Button,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IoGift, IoHome, IoPeople, IoTrophy } from 'react-icons/io5';
import { Link } from 'react-router';
import { IMAGE_SIZE, PAGE_WIDTH } from '@/constants/ui';

const QUICK_LINKS = [
  { label: 'Characters', to: '/characters', Icon: IoPeople, color: 'grape' },
  { label: 'Tier List', to: '/tier-list', Icon: IoTrophy, color: 'yellow' },
  { label: 'Codes', to: '/codes', Icon: IoGift, color: 'teal' },
];

export default function NotFound() {
  return (
    <Container size={PAGE_WIDTH.NARROW} py={80}>
      <Stack align="center" gap="xl">
        <Text
          style={{
            fontSize: 'clamp(4rem, 10vw, 8rem)',
            fontWeight: 900,
            lineHeight: 1,
            background: 'var(--dt-brand-gradient)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            userSelect: 'none',
          }}
        >
          404
        </Text>

        <Stack align="center" gap="sm">
          <Title order={1} size="h2">
            Page Not Found
          </Title>
          <Text c="dimmed" ta="center" maw={360}>
            The page you're looking for doesn't exist or has been moved.
          </Text>
        </Stack>

        <Button
          component={Link}
          to="/"
          size="md"
          leftSection={<IoHome size={IMAGE_SIZE.ICON_LG} />}
          variant="light"
        >
          Back to Home
        </Button>

        <Divider label="Or jump to" labelPosition="center" w="100%" maw={320} />

        <Group gap="sm" justify="center">
          {QUICK_LINKS.map(({ label, to, Icon, color }) => (
            <Button
              key={to}
              component={Link}
              to={to}
              variant="light"
              color={color}
              size="sm"
              radius="md"
              leftSection={<Icon size={14} />}
            >
              {label}
            </Button>
          ))}
        </Group>
      </Stack>
    </Container>
  );
}
