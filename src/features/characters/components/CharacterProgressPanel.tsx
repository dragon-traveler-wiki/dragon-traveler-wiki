import { StaticSurface } from '@/components/ui/Surface';
import { CharacterOwnershipContext } from '@/contexts';
import { Select, Stack, Title } from '@mantine/core';
import { useContext } from 'react';

interface StarLevelOption {
  value: string;
  label: string;
}

interface CharacterProgressPanelProps {
  starLevelOptions: StarLevelOption[];
  value: string;
  onChange: (value: string | null) => void;
}

export default function CharacterProgressPanel({
  starLevelOptions,
  value,
  onChange,
}: CharacterProgressPanelProps) {
  const { characterTrackingEnabled } = useContext(CharacterOwnershipContext);

  if (!characterTrackingEnabled || starLevelOptions.length <= 1) {
    return null;
  }

  return (
    <StaticSurface p={{ base: 'sm', sm: 'md' }} radius="lg">
      <Stack gap="sm">
        <Title order={2} size="h4">
          My Progress
        </Title>
        <Select
          label="Star Level"
          description="Track your owned star level for this character."
          data={starLevelOptions}
          value={value}
          onChange={onChange}
          comboboxProps={{ withinPortal: false }}
          size="sm"
        />
      </Stack>
    </StaticSurface>
  );
}
