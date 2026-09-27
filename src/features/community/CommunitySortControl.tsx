import { Select } from '@mantine/core';
import { useGradientAccent } from '@/hooks';

export type CommunitySort = 'top' | 'new';

interface CommunitySortControlProps {
  value: CommunitySort;
  onChange: (value: CommunitySort) => void;
}

const SORT_OPTIONS = [
  { value: 'top', label: 'Top rated' },
  { value: 'new', label: 'Newest' },
];

export default function CommunitySortControl({
  value,
  onChange,
}: CommunitySortControlProps) {
  const { accent } = useGradientAccent();
  return (
    <Select
      value={value}
      onChange={(next) => onChange(next === 'new' ? 'new' : 'top')}
      data={SORT_OPTIONS}
      allowDeselect={false}
      w={130}
      color={accent.primary}
      aria-label="Sort by"
    />
  );
}
