import SafeImage from '@/components/ui/SafeImage';
import { FACTION_ICON_MAP } from '@/assets';
import { GEAR_TYPE_ICON_MAP } from '@/assets';
import { QUALITY_ICON_MAP } from '@/assets';
import {
  GITHUB_REPO_URL,
  MAX_GITHUB_ISSUE_URL_LENGTH,
  buildEmptyIssueBody,
} from '@/constants/github';
import { useGradientAccent, useIsMobile } from '@/hooks';
import { showWarningToast } from '@/utils/toast';
import {
  ActionIcon,
  Button,
  Tooltip,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback, useDeferredValue, useState } from 'react';
import {
  IoAdd,
  IoAddCircleOutline,
  IoClose,
  IoCopy,
  IoOpenOutline,
} from 'react-icons/io5';

export type FieldType =
  'text' | 'textarea' | 'select' | 'boolean' | 'number' | 'url';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: readonly (string | SelectOption)[];
  optionIcons?: Record<string, string>;
  description?: string;
}

function getOptionValue(opt: string | SelectOption): string {
  return typeof opt === 'string' ? opt : opt.value;
}

function getOptionLabel(opt: string | SelectOption): string {
  return typeof opt === 'string' ? opt : opt.label;
}

export interface ArrayFieldDef {
  name: string;
  label: string;
  fields: FieldDef[];
  minItems?: number;
  /** When set, outputs a dict keyed by `key` field with `value` field as the value instead of an array */
  toDict?: { key: string; value: string };
}

export interface SuggestModalProps {
  buttonLabel: string;
  modalTitle: string;
  issueTitle: string;
  fields: FieldDef[];
  arrayFields?: ArrayFieldDef[];
  /** Fields to exclude from the JSON body sent to GitHub (e.g., informational-only fields) */
  excludeFromJson?: string[];
}

function buildIssueUrl(params: { title: string; body: string }): string {
  return `${GITHUB_REPO_URL}/issues/new?${new URLSearchParams(params).toString()}`;
}

function buildInitialValues(
  fields: FieldDef[],
): Record<string, string | boolean> {
  const values: Record<string, string | boolean> = {};
  for (const f of fields) {
    values[f.name] = f.type === 'boolean' ? true : '';
  }
  return values;
}

function newRowId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function buildInitialArrayRow(
  fields: FieldDef[],
): Record<string, string | boolean> {
  return { ...buildInitialValues(fields), _id: newRowId() };
}

function isBlank(value: string | boolean | undefined): boolean {
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  return value === false || value == null;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getFieldError(
  f: FieldDef,
  value: string | boolean,
): string | undefined {
  if (f.required && isBlank(value)) return `${f.label} is required`;
  if (
    f.type === 'url' &&
    typeof value === 'string' &&
    value.trim() !== '' &&
    !isValidUrl(value)
  ) {
    return 'Must be a valid http:// or https:// URL';
  }
  if (
    f.type === 'number' &&
    typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isNaN(Number(value))
  ) {
    return 'Must be a valid number';
  }
  if (
    f.type === 'select' &&
    typeof value === 'string' &&
    value !== '' &&
    f.options &&
    f.options.length > 0 &&
    !f.options.some((o) => getOptionValue(o) === value)
  ) {
    return 'Invalid selection';
  }
  return undefined;
}

const AUTO_OPTION_ICON_MAP: Record<string, string> = {
  ...QUALITY_ICON_MAP,
  ...FACTION_ICON_MAP,
  ...GEAR_TYPE_ICON_MAP,
};

function getOptionIcon(field: FieldDef, option: string): string | undefined {
  return field.optionIcons?.[option] ?? AUTO_OPTION_ICON_MAP[option];
}

export default function SuggestModal({
  buttonLabel,
  modalTitle,
  issueTitle,
  fields,
  arrayFields,
  excludeFromJson,
}: SuggestModalProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const isMobile = useIsMobile();
  const { accent } = useGradientAccent();
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    buildInitialValues(fields),
  );
  const [arrayValues, setArrayValues] = useState<
    Record<string, Record<string, string | boolean>[]>
  >(() => {
    const init: Record<string, Record<string, string | boolean>[]> = {};
    for (const af of arrayFields ?? []) {
      init[af.name] = [buildInitialArrayRow(af.fields)];
    }
    return init;
  });
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [jsonTooLong, setJsonTooLong] = useState(false);

  const reset = useCallback(() => {
    setValues(buildInitialValues(fields));
    const init: Record<string, Record<string, string | boolean>[]> = {};
    for (const af of arrayFields ?? []) {
      init[af.name] = [buildInitialArrayRow(af.fields)];
    }
    setArrayValues(init);
  }, [fields, arrayFields]);

  const handleOpen = () => {
    reset();
    setTouched(new Set());
    setSubmitAttempted(false);
    setJsonTooLong(false);
    open();
  };

  const setField = (name: string, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const markTouched = (name: string) => {
    setTouched((prev) => {
      const next = new Set(prev);
      next.add(name);
      return next;
    });
  };

  const setArrayField = (
    arrayName: string,
    index: number,
    fieldName: string,
    value: string | boolean,
  ) => {
    setArrayValues((prev) => {
      const rows = [...prev[arrayName]];
      rows[index] = { ...rows[index], [fieldName]: value };
      return { ...prev, [arrayName]: rows };
    });
  };

  const addArrayRow = (arrayName: string) => {
    const af = arrayFields?.find((a) => a.name === arrayName);
    if (!af) return;
    setArrayValues((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], buildInitialArrayRow(af.fields)],
    }));
  };

  const removeArrayRow = (arrayName: string, index: number) => {
    setArrayValues((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  const buildJsonData = (
    formValues: Record<string, string | boolean> = values,
    formArrayValues: Record<
      string,
      Record<string, string | boolean>[]
    > = arrayValues,
  ) => {
    const excludeSet = new Set(excludeFromJson ?? []);
    const data: Record<string, unknown> = {};
    for (const f of fields) {
      if (excludeSet.has(f.name)) continue;
      const val = formValues[f.name];
      if (f.type === 'boolean') {
        data[f.name] = val;
      } else if (val !== '') {
        data[f.name] = val;
      }
    }
    for (const af of arrayFields ?? []) {
      const filteredRows = formArrayValues[af.name].filter((row) =>
        af.fields.some((f) => row[f.name] !== '' && row[f.name] !== false),
      );

      if (af.toDict) {
        const dict: Record<string, unknown> = {};
        for (const row of filteredRows) {
          const k = row[af.toDict.key];
          const v = row[af.toDict.value];
          if (typeof k === 'string' && k) {
            const num = typeof v === 'string' && v !== '' ? Number(v) : NaN;
            dict[k] = Number.isNaN(num) ? v : num;
          }
        }
        data[af.name] = dict;
      } else {
        data[af.name] = filteredRows.map((row) => {
          const entry: Record<string, unknown> = {};
          for (const f of af.fields) {
            const val = row[f.name];
            if (f.type === 'boolean') {
              entry[f.name] = val;
            } else if (val !== '') {
              entry[f.name] = val;
            }
          }
          return entry;
        });
      }
    }
    return data;
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (!isValid()) return;
    const data = buildJsonData();
    const jsonStr = JSON.stringify(data, null, 2);
    const body = `**Paste your JSON below:**\n\n\`\`\`json\n${jsonStr}\n\`\`\`\n`;
    const fullUrl = buildIssueUrl({ title: issueTitle, body });

    if (fullUrl.length > MAX_GITHUB_ISSUE_URL_LENGTH) {
      const emptyUrl = buildIssueUrl({
        title: issueTitle,
        body: buildEmptyIssueBody(''),
      });
      window.open(emptyUrl, '_blank', 'noopener,noreferrer');
      setJsonTooLong(true);
      showWarningToast({
        title: 'JSON is too large for URL',
        message:
          'The GitHub issue opened with an empty template. Use the Copy JSON button to copy your data and paste it into the issue body.',
        autoClose: 8000,
      });
      return;
    }

    window.open(fullUrl, '_blank', 'noopener,noreferrer');
    close();
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(buildJsonData(), null, 2);
    navigator.clipboard.writeText(jsonStr);
  };

  const isValid = (
    formValues: Record<string, string | boolean> = values,
    formArrayValues: Record<
      string,
      Record<string, string | boolean>[]
    > = arrayValues,
  ) => {
    for (const f of fields) {
      if (getFieldError(f, formValues[f.name])) return false;
    }

    for (const af of arrayFields ?? []) {
      const rows = formArrayValues[af.name] ?? [];
      const filledRows = rows.filter((row) =>
        af.fields.some((f) => !isBlank(row[f.name])),
      );

      if ((af.minItems ?? 0) > 0 && filledRows.length < (af.minItems ?? 0)) {
        return false;
      }

      for (const row of filledRows) {
        for (const f of af.fields) {
          if (getFieldError(f, row[f.name])) return false;
        }
      }
    }
    return true;
  };

  const deferredValues = useDeferredValue(values);
  const deferredArrayValues = useDeferredValue(arrayValues);
  const isFormValid = isValid(deferredValues, deferredArrayValues);

  const renderField = (
    f: FieldDef,
    value: string | boolean,
    onChange: (val: string | boolean) => void,
    fieldOptions?: { error?: string; onBlur?: () => void },
  ) => {
    const { error, onBlur } = fieldOptions ?? {};
    switch (f.type) {
      case 'select': {
        const selectedValue = (value as string) || '';
        const selectedIcon = selectedValue
          ? getOptionIcon(f, selectedValue)
          : undefined;
        return (
          <Select
            key={f.name}
            label={f.label}
            placeholder={f.placeholder}
            description={f.description}
            data={(f.options ?? []).map((option) => ({
              value: getOptionValue(option),
              label: getOptionLabel(option),
            }))}
            value={(value as string) || null}
            onChange={(v) => onChange(v ?? '')}
            onBlur={onBlur}
            clearable
            searchable={(f.options?.length ?? 0) >= 10}
            withAsterisk={f.required}
            error={error}
            leftSection={
              selectedIcon ? (
                <SafeImage
                  src={selectedIcon}
                  alt={selectedValue}
                  w={16}
                  h={16}
                  fit="contain"
                />
              ) : undefined
            }
            renderOption={({ option }) => {
              const optionIcon = getOptionIcon(f, option.value);
              if (!optionIcon) return option.label;
              return (
                <Group gap="xs" wrap="nowrap">
                  <SafeImage
                    src={optionIcon}
                    alt={option.label}
                    w={16}
                    h={16}
                    fit="contain"
                  />
                  <span>{option.label}</span>
                </Group>
              );
            }}
          />
        );
      }
      case 'boolean':
        return (
          <Switch
            key={f.name}
            label={f.label}
            description={f.description}
            checked={value as boolean}
            onChange={(e) => onChange(e.currentTarget.checked)}
          />
        );
      case 'textarea':
        return (
          <Textarea
            key={f.name}
            label={f.label}
            placeholder={f.placeholder}
            description={f.description}
            value={value as string}
            onChange={(e) => onChange(e.currentTarget.value)}
            onBlur={onBlur}
            autosize
            minRows={2}
            maxRows={6}
            withAsterisk={f.required}
            error={error}
          />
        );
      case 'number':
        return (
          <NumberInput
            key={f.name}
            label={f.label}
            placeholder={f.placeholder}
            description={f.description}
            value={value === '' ? '' : Number(value as string)}
            onChange={(v) => onChange(v === '' ? '' : String(v))}
            onBlur={onBlur}
            withAsterisk={f.required}
            error={error}
          />
        );
      case 'url':
        return (
          <TextInput
            key={f.name}
            type="url"
            label={f.label}
            placeholder={f.placeholder ?? 'https://'}
            description={f.description}
            value={value as string}
            onChange={(e) => onChange(e.currentTarget.value)}
            onBlur={onBlur}
            withAsterisk={f.required}
            error={error}
          />
        );
      default:
        return (
          <TextInput
            key={f.name}
            label={f.label}
            placeholder={f.placeholder}
            description={f.description}
            value={value as string}
            onChange={(e) => onChange(e.currentTarget.value)}
            onBlur={onBlur}
            withAsterisk={f.required}
            error={error}
          />
        );
    }
  };

  return (
    <>
      {isMobile ? (
        <Tooltip label={buttonLabel}>
          <ActionIcon
            variant="light"
            color={accent.primary}
            size="lg"
            onClick={handleOpen}
            aria-label={buttonLabel}
          >
            <IoAddCircleOutline size={16} />
          </ActionIcon>
        </Tooltip>
      ) : (
        <Button
          variant="light"
          color={accent.primary}
          size="xs"
          leftSection={<IoAddCircleOutline size={16} />}
          onClick={handleOpen}
        >
          {buttonLabel}
        </Button>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title={modalTitle}
        size={isMobile ? '100%' : 'lg'}
        fullScreen={isMobile}
        centered
        lockScroll={false}
      >
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            Fill out the form below. This will open a GitHub issue with your
            suggestion.
          </Text>

          {fields.map((f) =>
            renderField(f, values[f.name], (val) => setField(f.name, val), {
              error:
                touched.has(f.name) || submitAttempted
                  ? getFieldError(f, values[f.name])
                  : undefined,
              onBlur: () => markTouched(f.name),
            }),
          )}

          {arrayFields?.map((af) => (
            <Stack key={af.name} gap="xs">
              <Group justify="space-between">
                <Text fw={500} size="sm">
                  {af.label}
                </Text>
                <Button
                  variant="subtle"
                  color={accent.secondary}
                  size={isMobile ? 'sm' : 'xs'}
                  leftSection={<IoAdd size={14} />}
                  onClick={() => addArrayRow(af.name)}
                >
                  Add
                </Button>
              </Group>
              {arrayValues[af.name]?.map((row, idx) => {
                const rowId = row._id as string;
                return (
                  <Group key={rowId} gap="xs" align="flex-end" wrap="nowrap">
                    <Group gap="xs" style={{ flex: 1 }} grow wrap="wrap">
                      {af.fields.map((f) =>
                        renderField(
                          f,
                          row[f.name],
                          (val) => setArrayField(af.name, idx, f.name, val),
                          {
                            error: submitAttempted
                              ? getFieldError(f, row[f.name])
                              : undefined,
                          },
                        ),
                      )}
                    </Group>
                    {arrayValues[af.name].length > 1 && (
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size={isMobile ? 'md' : 'sm'}
                        onClick={() => removeArrayRow(af.name, idx)}
                        aria-label="Remove row"
                      >
                        <IoClose size={14} />
                      </ActionIcon>
                    )}
                  </Group>
                );
              })}
            </Stack>
          ))}

          <Group justify="flex-end" mt="md">
            {jsonTooLong && (
              <Button
                variant="light"
                color={accent.secondary}
                leftSection={<IoCopy size={16} />}
                onClick={handleCopyJson}
              >
                Copy JSON
              </Button>
            )}
            <Button
              color={accent.primary}
              leftSection={<IoOpenOutline size={16} />}
              onClick={handleSubmit}
              disabled={!isFormValid}
            >
              Submit Suggestion
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
