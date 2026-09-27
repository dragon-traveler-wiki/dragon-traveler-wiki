import { IMAGE_SIZE } from '@/constants/ui';
import { useGradientAccent } from '@/hooks';
import {
  Button,
  Chip,
  Group,
  MultiSelect,
  Text,
  TextInput,
  Tooltip,
  type MultiSelectProps,
  type TextInputProps,
} from '@mantine/core';
import { IoInformationCircleOutline } from 'react-icons/io5';
import { useDebouncedValue } from '@mantine/hooks';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { IoClose, IoSearch } from 'react-icons/io5';

export interface FilterSearchInputProps extends Omit<
  TextInputProps,
  'onChange'
> {
  iconSize?: number;
  /** Called with the search string after debounce. Use instead of onChange. */
  onSearch?: (value: string) => void;
  debounceMs?: number;
}

export function FilterSearchInput({
  iconSize = IMAGE_SIZE.ICON_MD,
  color,
  leftSection,
  value,
  onSearch,
  debounceMs = 150,
  ...props
}: FilterSearchInputProps) {
  const { accent } = useGradientAccent();
  const searchIconColor = `var(--mantine-color-${accent.primary}-6)`;
  const [localValue, setLocalValue] = useState((value as string) ?? '');
  const [prevExternalValue, setPrevExternalValue] = useState(value);
  const [debouncedValue] = useDebouncedValue(localValue, debounceMs);
  const onSearchRef = useRef(onSearch);
  useLayoutEffect(() => {
    onSearchRef.current = onSearch;
  });
  const isFirstRender = useRef(true);

  // Sync local value when external value changes (e.g., Clear button resets to '')
  if (prevExternalValue !== value) {
    setPrevExternalValue(value);
    setLocalValue((value as string) ?? '');
  }

  // Notify parent after debounce (skip on mount to avoid spurious initial call)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onSearchRef.current?.(debouncedValue);
  }, [debouncedValue]);

  return (
    <TextInput
      color={color ?? accent.primary}
      leftSection={
        leftSection ?? <IoSearch size={iconSize} color={searchIconColor} />
      }
      value={localValue}
      onChange={(e) => setLocalValue(e.currentTarget.value)}
      {...props}
    />
  );
}

export function FilterMultiSelect({ color, ...props }: MultiSelectProps) {
  const { accent } = useGradientAccent();

  return <MultiSelect color={color ?? accent.primary} {...props} />;
}

export interface FilterClearButtonProps {
  onClick: () => void;
  size?: 'xs' | 'sm' | 'md' | 'compact-xs';
  label?: string;
}

export function FilterClearButton({
  onClick,
  size = 'xs',
  label = 'Clear',
}: FilterClearButtonProps) {
  const { accent } = useGradientAccent();

  return (
    <Button
      variant="subtle"
      color={accent.primary}
      size={size}
      leftSection={<IoClose size={IMAGE_SIZE.ICON_SM} />}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export interface FilterSectionProps {
  label: string;
  info?: string;
  children: ReactNode;
}

export function FilterSection({ label, info, children }: FilterSectionProps) {
  return (
    <Group gap="xs" align="center" wrap="wrap">
      <Group gap={4} align="center" style={{ minWidth: 80 }}>
        <Text size="xs" fw={600} tt="uppercase" c="dimmed">
          {label}
        </Text>
        {info && (
          <Tooltip label={info} multiline maw={220} withArrow position="top">
            <Text
              component="span"
              c="dimmed"
              style={{ lineHeight: 1, cursor: 'default' }}
            >
              <IoInformationCircleOutline size={13} />
            </Text>
          </Tooltip>
        )}
      </Group>
      {children}
    </Group>
  );
}

export interface FilterChipOption {
  value: string;
  label: ReactNode;
}

export interface FilterChipGroupProps {
  value: string[];
  onChange: (values: string[]) => void;
  options: FilterChipOption[];
  size?: 'xs' | 'md';
}

export function FilterChipGroup({
  value,
  onChange,
  options,
  size = 'xs',
}: FilterChipGroupProps) {
  const { accent } = useGradientAccent();

  return (
    <Chip.Group multiple value={value} onChange={onChange}>
      <Group gap={4} wrap="wrap">
        {options.map((option) => (
          <Chip
            key={option.value}
            value={option.value}
            size={size}
            color={accent.primary}
          >
            {option.label}
          </Chip>
        ))}
      </Group>
    </Chip.Group>
  );
}
