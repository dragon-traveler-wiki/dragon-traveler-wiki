import { Container, Stack, Tabs } from '@mantine/core';
import ListPageHeader from '@/components/layout/ListPageHeader';
import { StaticSurface } from '@/components/ui/Surface';
import AbilityMode from '@/features/dtdle/components/AbilityMode';
import ClassicMode from '@/features/dtdle/components/ClassicMode';
import IllustrationMode from '@/features/dtdle/components/IllustrationMode';
import QuoteMode from '@/features/dtdle/components/QuoteMode';
import { useTabParam } from '@/hooks';
import { PAGE_WIDTH } from '@/constants/ui';

const VALID_MODES = ['classic', 'quote', 'ability', 'illustration'];

export default function Dtdle() {
  const [activeMode, setActiveMode] = useTabParam(
    'mode',
    'classic',
    VALID_MODES,
  );

  return (
    <Container size={PAGE_WIDTH.READING} py={{ base: 'lg', sm: 'xl' }}>
      <Stack gap="lg">
        <ListPageHeader
          title="DTdle"
          description="Guess today's mystery character. One character a day, unlimited guesses."
        />

        {/* Each mode persists its daily progress to storage, so unmounting
            hidden modes only drops transient input state. */}
        <Tabs
          value={activeMode}
          onChange={setActiveMode}
          keepMounted={false}
          styles={{ tab: { paddingInline: 'var(--mantine-spacing-xs)' } }}
        >
          <Tabs.List grow>
            <Tabs.Tab value="classic">Classic</Tabs.Tab>
            <Tabs.Tab value="quote">Quote</Tabs.Tab>
            <Tabs.Tab value="ability">Ability</Tabs.Tab>
            <Tabs.Tab value="illustration">Illustration</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="classic" pt="md">
            <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
              <ClassicMode />
            </StaticSurface>
          </Tabs.Panel>
          <Tabs.Panel value="quote" pt="md">
            <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
              <QuoteMode />
            </StaticSurface>
          </Tabs.Panel>
          <Tabs.Panel value="ability" pt="md">
            <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
              <AbilityMode />
            </StaticSurface>
          </Tabs.Panel>
          <Tabs.Panel value="illustration" pt="md">
            <StaticSurface p={{ base: 'sm', sm: 'lg' }}>
              <IllustrationMode />
            </StaticSurface>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}
