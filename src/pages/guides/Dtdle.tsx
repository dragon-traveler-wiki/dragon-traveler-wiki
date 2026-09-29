import { Card, Container, Stack, Tabs, Text, Title } from '@mantine/core';
import AbilityMode from '@/features/dtdle/components/AbilityMode';
import ClassicMode from '@/features/dtdle/components/ClassicMode';
import IllustrationMode from '@/features/dtdle/components/IllustrationMode';
import QuoteMode from '@/features/dtdle/components/QuoteMode';
import { useTabParam } from '@/hooks';

const VALID_MODES = ['classic', 'quote', 'ability', 'illustration'];

export default function Dtdle() {
  const [activeMode, setActiveMode] = useTabParam(
    'mode',
    'classic',
    VALID_MODES,
  );

  return (
    <Container size="md" py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <Stack gap={2}>
          <Title order={1}>DTdle</Title>
          <Text size="sm" c="dimmed">
            Guess today&apos;s mystery character. One character a day, unlimited
            guesses.
          </Text>
        </Stack>

        <Tabs value={activeMode} onChange={setActiveMode}>
          <Tabs.List>
            <Tabs.Tab value="classic">Classic</Tabs.Tab>
            <Tabs.Tab value="quote">Quote</Tabs.Tab>
            <Tabs.Tab value="ability">Ability</Tabs.Tab>
            <Tabs.Tab value="illustration">Illustration</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="classic" pt="md">
            <Card withBorder radius="md" p="lg">
              <ClassicMode />
            </Card>
          </Tabs.Panel>
          <Tabs.Panel value="quote" pt="md">
            <Card withBorder radius="md" p="lg">
              <QuoteMode />
            </Card>
          </Tabs.Panel>
          <Tabs.Panel value="ability" pt="md">
            <Card withBorder radius="md" p="lg">
              <AbilityMode />
            </Card>
          </Tabs.Panel>
          <Tabs.Panel value="illustration" pt="md">
            <Card withBorder radius="md" p="lg">
              <IllustrationMode />
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
