import { useGradientAccent, useIsMobile, useMobileTooltip } from '@/hooks';
import { ActionIcon, Button, CopyButton, Group, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';
import {
  IoCheckmark,
  IoClipboardOutline,
  IoCopy,
  IoDownload,
  IoOpenOutline,
  IoSave,
  IoTrash,
} from 'react-icons/io5';

export interface BuilderToolbarAction {
  label: string;
  mobileLabel?: string;
  icon: IconType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
}

interface BuilderToolbarProps {
  json: string;
  hasContent: boolean;
  hasAnyBuilderData: boolean;
  isCapturing: boolean;
  onPasteOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  onClear: () => void;
  additionalPrimaryActions?: BuilderToolbarAction[];
  trailingContent?: ReactNode;
}

function ResponsiveToolbarAction({
  action,
  defaultColor,
  isMobile,
  mobileTooltip,
}: {
  action: BuilderToolbarAction;
  defaultColor: string;
  isMobile: boolean;
  mobileTooltip: ReturnType<typeof useMobileTooltip>;
}) {
  const Icon = action.icon;
  const color = action.color ?? defaultColor;

  return isMobile ? (
    <Tooltip label={action.mobileLabel ?? action.label} {...mobileTooltip}>
      <ActionIcon
        variant="light"
        color={color}
        size="lg"
        disabled={action.disabled}
        loading={action.loading}
        onClick={action.onClick}
        aria-label={action.mobileLabel ?? action.label}
      >
        <Icon size={16} />
      </ActionIcon>
    </Tooltip>
  ) : (
    <Button
      variant="light"
      color={color}
      size="sm"
      leftSection={<Icon size={16} />}
      disabled={action.disabled}
      loading={action.loading}
      onClick={action.onClick}
    >
      {action.label}
    </Button>
  );
}

export default function BuilderToolbar({
  json,
  hasContent,
  hasAnyBuilderData,
  isCapturing,
  onPasteOpen,
  onSave,
  onExport,
  onSubmit,
  submitLabel = 'Publish',
  onClear,
  additionalPrimaryActions = [],
  trailingContent,
}: BuilderToolbarProps) {
  const { accent } = useGradientAccent();
  const isMobile = useIsMobile();
  const mobileTooltip = useMobileTooltip();

  const primaryActions: BuilderToolbarAction[] = [
    {
      label: 'Paste JSON',
      icon: IoClipboardOutline,
      onClick: onPasteOpen,
    },
    {
      label: 'Save',
      mobileLabel: 'Save to My Saved',
      icon: IoSave,
      onClick: onSave,
    },
    ...additionalPrimaryActions,
  ];
  const secondaryActions: BuilderToolbarAction[] = [
    {
      label: 'Export Image',
      mobileLabel: 'Export as Image',
      icon: IoDownload,
      onClick: onExport,
      disabled: !hasContent,
      loading: isCapturing,
    },
    {
      label: submitLabel,
      icon: IoOpenOutline,
      onClick: onSubmit,
      disabled: !hasContent,
    },
    {
      label: 'Clear All',
      icon: IoTrash,
      onClick: onClear,
      disabled: !hasAnyBuilderData,
      color: 'red',
    },
  ];

  return (
    <Group justify="space-between" wrap="nowrap" gap="sm">
      <Group gap="xs" wrap="nowrap" align="center">
        <CopyButton value={json}>
          {({ copied, copy }) => {
            const label = copied ? 'Copied' : 'Copy JSON';
            const color = copied ? accent.secondary : accent.primary;

            return isMobile ? (
              <Tooltip label={copied ? 'Copied!' : label} {...mobileTooltip}>
                <ActionIcon
                  variant="light"
                  color={color}
                  size="lg"
                  onClick={copy}
                  aria-label={label}
                >
                  {copied ? <IoCheckmark size={16} /> : <IoCopy size={16} />}
                </ActionIcon>
              </Tooltip>
            ) : (
              <Button
                variant="light"
                color={color}
                size="sm"
                leftSection={
                  copied ? <IoCheckmark size={16} /> : <IoCopy size={16} />
                }
                onClick={copy}
              >
                {label}
              </Button>
            );
          }}
        </CopyButton>

        {primaryActions.map((action) => (
          <ResponsiveToolbarAction
            key={action.label}
            action={action}
            defaultColor={accent.primary}
            isMobile={isMobile}
            mobileTooltip={mobileTooltip}
          />
        ))}
      </Group>

      <Group gap="xs" wrap="nowrap">
        {secondaryActions.map((action) => (
          <ResponsiveToolbarAction
            key={action.label}
            action={action}
            defaultColor={accent.primary}
            isMobile={isMobile}
            mobileTooltip={mobileTooltip}
          />
        ))}
        {trailingContent}
      </Group>
    </Group>
  );
}
