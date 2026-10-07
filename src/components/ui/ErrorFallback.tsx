import { useGradientAccent } from '@/hooks';
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Code,
  Container,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { useEffect, useId, useRef } from 'react';
import { IoAlertCircle, IoHome, IoRefresh } from 'react-icons/io5';
import { Link } from 'react-router';
import type { ErrorBoundaryScope } from './error-boundary-types';
import { PAGE_WIDTH } from '@/constants/ui';

interface ErrorFallbackProps {
  scope: ErrorBoundaryScope;
  error: Error;
  title?: string;
  message?: string;
  onReset: () => void;
}

export function ErrorDetails({ error }: { error: Error }) {
  if (!import.meta.env.DEV) return null;

  return (
    <Code
      block
      w="100%"
      mah={160}
      style={{
        fontSize: 'var(--mantine-font-size-xs)',
        overflow: 'auto',
        overflowWrap: 'anywhere',
        whiteSpace: 'pre-wrap',
      }}
    >
      {error.message}
    </Code>
  );
}

function PageErrorFallback({
  error,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Reload the page or head back home.',
  onReset,
}: Omit<ErrorFallbackProps, 'scope'>) {
  const { accent } = useGradientAccent();
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <Box role="alert" aria-labelledby={headingId}>
      <Container size={PAGE_WIDTH.NARROW} py={{ base: 48, sm: 80 }}>
        <Stack align="center" gap="xl">
          <ThemeIcon variant="light" color="red" size={72} radius="xl">
            <IoAlertCircle aria-hidden size={40} />
          </ThemeIcon>

          <Stack align="center" gap="sm">
            <Title
              id={headingId}
              ref={headingRef}
              order={2}
              tabIndex={-1}
              ta="center"
            >
              {title}
            </Title>
            <Text c="dimmed" ta="center" maw={400}>
              {message}
            </Text>
          </Stack>

          <ErrorDetails error={error} />

          <Group gap="sm" justify="center">
            <Button
              onClick={() => window.location.reload()}
              leftSection={<IoRefresh aria-hidden size={16} />}
              variant="light"
              color="red"
            >
              Reload page
            </Button>
            <Button
              component={Link}
              to="/"
              onClick={onReset}
              leftSection={<IoHome aria-hidden size={16} />}
              variant="outline"
              color={accent.primary}
            >
              Go home
            </Button>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}

function SectionErrorFallback({
  error,
  title = "This section couldn't be displayed",
  message = 'An unexpected error occurred while displaying this content.',
  onReset,
}: Omit<ErrorFallbackProps, 'scope'>) {
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => alertRef.current?.focus(), []);

  return (
    <Alert
      ref={alertRef}
      role="alert"
      tabIndex={-1}
      variant="light"
      color="red"
      radius="md"
      title={title}
      icon={<IoAlertCircle aria-hidden size={18} />}
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          {message}
        </Text>
        <ErrorDetails error={error} />
        <Group justify="flex-end">
          <Button
            size="xs"
            variant="light"
            color="red"
            leftSection={<IoRefresh aria-hidden size={14} />}
            onClick={onReset}
          >
            Retry
          </Button>
        </Group>
      </Stack>
    </Alert>
  );
}

function InlineErrorFallback({
  title = 'This action is unavailable',
  onReset,
}: Omit<ErrorFallbackProps, 'scope'>) {
  const actionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => actionRef.current?.focus(), []);

  return (
    <Tooltip label={`${title}. Select to retry.`}>
      <ActionIcon
        ref={actionRef}
        aria-label={`${title}. Retry`}
        color="red"
        onClick={onReset}
        size="sm"
        variant="subtle"
      >
        <IoAlertCircle aria-hidden />
      </ActionIcon>
    </Tooltip>
  );
}

export default function ErrorFallback(props: ErrorFallbackProps) {
  if (props.scope === 'page') return <PageErrorFallback {...props} />;
  if (props.scope === 'section') return <SectionErrorFallback {...props} />;
  return <InlineErrorFallback {...props} />;
}
