import JsonModal from '@/components/tools/JsonModal';
import MobileBottomDrawer from '@/components/ui/MobileBottomDrawer';
import { normalizeContentType } from '@/constants/content-types';
import { TRANSITION, Z_INDEX } from '@/constants/ui';
import type { CustomMantineAccent } from '@/contexts';

const SITE_DEFAULT_VALUE = '__site_default__';
import {
  BannerContext,
  CharacterOwnershipContext,
  CharacterSkinContext,
  LocaleContext,
  TierListReferenceContext,
  getSavedTierListKey,
  UiOpacityContext,
} from '@/contexts';
import {
  CUSTOM_COLOR_FIELDS,
  LOCALE_OPTIONS,
  PALETTE_SWATCHES,
  RANDOM_MODE_LABEL,
} from '@/features/settings/options';
import {
  buildSettingsExport,
  importSettings,
} from '@/features/settings/settings-storage';
import { SETTINGS_STORAGE_KEYS } from '@/features/settings/settings-storage-keys';
import {
  useDarkMode,
  useEffectiveNavLayout,
  useGradientAccent,
  useIsMobile,
  useMobileTooltip,
} from '@/hooks';
import {
  ActionIcon,
  Badge,
  Button,
  ColorInput,
  Divider,
  Group,
  Paper,
  Popover,
  SegmentedControl,
  Select,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Text,
  Tooltip,
  UnstyledButton,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useContext, useEffect, useMemo, useState } from 'react';
import { IoDownload, IoFolderOpen, IoSettingsOutline } from 'react-icons/io5';
import { showErrorToast } from '@/utils/toast';

export default function SettingsPanel({
  initiallyOpened = false,
}: {
  initiallyOpened?: boolean;
}) {
  const [opened, { toggle: toggleOpened, close: closeOpened }] =
    useDisclosure(initiallyOpened);
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);
  const [isBannerDropdownOpen, setIsBannerDropdownOpen] = useState(false);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const isDark = useDarkMode();
  const isMobile = useIsMobile();
  const mobileTooltip = useMobileTooltip();
  const { accent, palette, setPalette, customColors, setCustomColors } =
    useGradientAccent();
  const { navLayout, setNavLayout, effectiveNavLayout } =
    useEffectiveNavLayout();

  const {
    tierLists,
    savedTierLists,
    loading,
    selectedTierList,
    selectedKey,
    siteReferenceId,
    usingSiteDefault,
    selectTierList,
    followSiteDefault,
    clearSelection,
  } = useContext(TierListReferenceContext);
  const {
    selectedBanner,
    bannerSelectData,
    bannerPreference,
    setBannerPreference,
    defaultBannerValue,
    showOnAllRoutes,
    setShowOnAllRoutes,
    slowScrollEnabled,
    setSlowScrollEnabled,
    favoritesOnly,
    setFavoritesOnly,
    randomBannerMode,
    favoritesMatchingCurrentMode,
  } = useContext(BannerContext);
  const {
    bannerMediaOpacity,
    setBannerMediaOpacity,
    bannerOverlayOpacity,
    setBannerOverlayOpacity,
    surfaceOpacity,
    setSurfaceOpacity,
    resetOpacitySettings,
  } = useContext(UiOpacityContext);
  const {
    characterTrackingEnabled,
    setCharacterTrackingEnabled,
    grayUnowned,
    setGrayUnowned,
    showCharacterTiers,
    setShowCharacterTiers,
  } = useContext(CharacterOwnershipContext);
  const { locale, setLocale } = useContext(LocaleContext);
  const { skinsEnabled, setSkinsEnabled } = useContext(CharacterSkinContext);

  useEffect(() => {
    if (isMobile || !opened) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, opened]);

  const tierListOptions = useMemo(() => {
    const toOption = (
      list: { name: string; content_type: string },
      value: string,
    ) => ({
      value,
      label: `${list.name} (${normalizeContentType(list.content_type, 'All')})`,
    });
    const communityOptions = tierLists.flatMap((list) =>
      list.community ? [toOption(list, list.community.id)] : [],
    );
    // Keep the active community list selectable even when it isn't in the
    // top-rated page that was loaded.
    const activeCommunity = selectedTierList?.community;
    if (
      selectedTierList &&
      activeCommunity &&
      !communityOptions.some((option) => option.value === activeCommunity.id)
    ) {
      communityOptions.unshift(toOption(selectedTierList, activeCommunity.id));
    }
    const siteDefaultName = tierLists.find(
      (list) => list.community?.id === siteReferenceId,
    )?.name;
    const groups = [];
    if (siteReferenceId) {
      groups.push({
        group: 'Default',
        items: [
          {
            value: SITE_DEFAULT_VALUE,
            label: siteDefaultName
              ? `Site default (${siteDefaultName})`
              : 'Site default',
          },
        ],
      });
    }
    groups.push({ group: 'Community', items: communityOptions });
    if (savedTierLists.length > 0) {
      groups.push({
        group: 'My Saved',
        items: savedTierLists.map((list) =>
          toOption(list, getSavedTierListKey(list)),
        ),
      });
    }
    return groups;
  }, [tierLists, savedTierLists, selectedTierList, siteReferenceId]);

  const controlSize = isMobile ? 'md' : 'sm';
  const selectComboboxProps = {
    withinPortal: true,
    zIndex: Z_INDEX.TOOLTIP,
  } as const;

  // On mobile, the searchable banner Select triggers the virtual keyboard, which shifts
  // the viewport and causes the portaled dropdown to appear off-center. Using withinPortal: false
  // positions the dropdown relative to its DOM parent instead of the viewport, so it's unaffected.
  const bannerComboboxProps = isMobile
    ? ({ withinPortal: false, zIndex: Z_INDEX.TOOLTIP } as const)
    : selectComboboxProps;

  const [
    exportModalOpened,
    { open: openExportModal, close: closeExportModal },
  ] = useDisclosure(false);
  const [
    importModalOpened,
    { open: openImportModal, close: closeImportModal },
  ] = useDisclosure(false);
  const [exportJson, setExportJson] = useState('');

  const handleOpenExport = () => {
    try {
      setExportJson(buildSettingsExport(localStorage, SETTINGS_STORAGE_KEYS));
      openExportModal();
    } catch {
      showErrorToast({
        title: 'Could not export settings',
        message: 'Browser storage is unavailable. Please try again.',
      });
    }
  };

  const handleImport = (text: string): string | null => {
    const error = importSettings(text, localStorage, SETTINGS_STORAGE_KEYS);
    if (!error) {
      window.location.reload();
    }
    return error;
  };

  const settingsContent = (
    <Stack gap="md">
      <Paper p="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Language
          </Text>
          <Select
            size={controlSize}
            data={LOCALE_OPTIONS}
            value={locale}
            onChange={(value) => value && setLocale(value as typeof locale)}
            comboboxProps={selectComboboxProps}
            onDropdownOpen={() => setIsSelectDropdownOpen(true)}
            onDropdownClose={() => setIsSelectDropdownOpen(false)}
            allowDeselect={false}
          />
          <Text size="xs" c="dimmed">
            Changes which localized data files are loaded. Reload the page after
            switching.
          </Text>
        </Stack>
      </Paper>

      <Paper p="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Navigation
          </Text>
          <SegmentedControl
            fullWidth
            size={controlSize}
            value={navLayout}
            onChange={(value) => setNavLayout(value as typeof navLayout)}
            data={[
              { label: 'Sidebar', value: 'sidebar' },
              { label: 'Header', value: 'header' },
            ]}
            aria-label="Select navigation layout"
          />
          <Text size="xs" c="dimmed">
            {navLayout === 'header' && effectiveNavLayout === 'sidebar'
              ? 'Header nav needs a wider screen to fit — using the sidebar for now.'
              : 'Header nav is only available on wide screens; narrower screens always use the sidebar.'}
          </Text>
        </Stack>
      </Paper>

      <Paper p="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="sm" fw={600}>
              Theme
            </Text>
            <Text size="xs" c="dimmed" fw={600}>
              {colorScheme === 'auto'
                ? `Auto (${isDark ? 'Dark' : 'Light'})`
                : isDark
                  ? 'Dark'
                  : 'Light'}
            </Text>
          </Group>

          <SegmentedControl
            fullWidth
            size={controlSize}
            value={colorScheme}
            onChange={(value) =>
              setColorScheme(value as 'auto' | 'dark' | 'light')
            }
            data={[
              { label: 'Auto', value: 'auto' },
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
            ]}
            aria-label="Select theme"
          />

          <Stack gap={6}>
            <Text size={controlSize} fw={500}>
              Gradient Palette
            </Text>
            <SimpleGrid cols={4} spacing={6}>
              {PALETTE_SWATCHES.map((p) => (
                <Tooltip key={p.value} label={p.label} {...mobileTooltip}>
                  <UnstyledButton
                    onClick={() => setPalette(p.value)}
                    aria-label={`${p.label}${palette === p.value ? ' (selected)' : ''}`}
                    aria-pressed={palette === p.value}
                    style={{
                      height: 28,
                      borderRadius: 'var(--mantine-radius-sm)',
                      background: p.gradient,
                      border: `2px solid ${
                        palette === p.value
                          ? 'var(--mantine-primary-color-5)'
                          : 'transparent'
                      }`,
                      outline:
                        palette === p.value
                          ? '2px solid var(--mantine-primary-color-6)'
                          : 'none',
                      outlineOffset: 1,
                      cursor: 'pointer',
                      transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}, border-color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                    }}
                    onMouseEnter={(e) => {
                      if (palette !== p.value)
                        e.currentTarget.style.transform = 'scale(1.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                </Tooltip>
              ))}
            </SimpleGrid>

            {/* Custom palette swatch */}
            <Tooltip label="Custom" {...mobileTooltip}>
              <UnstyledButton
                onClick={() => setPalette('custom')}
                aria-label={`Custom${palette === 'custom' ? ' (selected)' : ''}`}
                aria-pressed={palette === 'custom'}
                style={{
                  height: 28,
                  borderRadius: 'var(--mantine-radius-sm)',
                  background: `linear-gradient(135deg, ${customColors.colorA} 0%, ${customColors.colorB} 100%)`,
                  border: `2px solid ${
                    palette === 'custom'
                      ? 'var(--mantine-primary-color-5)'
                      : 'transparent'
                  }`,
                  outline:
                    palette === 'custom'
                      ? '2px solid var(--mantine-primary-color-6)'
                      : 'none',
                  outlineOffset: 1,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: `transform ${TRANSITION.FAST} ${TRANSITION.EASE}, border-color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                }}
                onMouseEnter={(e) => {
                  if (palette !== 'custom')
                    e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Text
                  size="xs"
                  fw={700}
                  style={{
                    color: '#fff',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    letterSpacing: '0.04em',
                  }}
                >
                  Custom
                </Text>
              </UnstyledButton>
            </Tooltip>

            {/* Custom palette editor — shown when custom is selected */}
            {palette === 'custom' && (
              <Stack gap={8} mt={4}>
                <Group grow gap={8}>
                  {CUSTOM_COLOR_FIELDS.map(({ key, label, swatches }) => (
                    <ColorInput
                      key={key}
                      label={label}
                      size="xs"
                      format="hex"
                      value={customColors[key]}
                      onChange={(v) =>
                        setCustomColors({ ...customColors, [key]: v })
                      }
                      popoverProps={{
                        withinPortal: false,
                        zIndex: Z_INDEX.TOOLTIP,
                      }}
                      swatches={swatches}
                      swatchesPerRow={8}
                    />
                  ))}
                </Group>
                <Select
                  label="UI Accent"
                  size="xs"
                  value={customColors.mantineAccent}
                  onChange={(v) =>
                    v &&
                    setCustomColors({
                      ...customColors,
                      mantineAccent: v as CustomMantineAccent,
                    })
                  }
                  onDropdownOpen={() => setIsSelectDropdownOpen(true)}
                  onDropdownClose={() => setIsSelectDropdownOpen(false)}
                  comboboxProps={selectComboboxProps}
                  data={[
                    { value: 'violet', label: 'Violet' },
                    { value: 'blue', label: 'Blue' },
                    { value: 'teal', label: 'Teal' },
                    { value: 'green', label: 'Green' },
                    { value: 'orange', label: 'Orange' },
                    { value: 'red', label: 'Red' },
                    { value: 'pink', label: 'Pink' },
                    { value: 'yellow', label: 'Yellow' },
                  ]}
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Paper p="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Characters
          </Text>
          <Switch
            size={isMobile ? 'md' : 'sm'}
            color={accent.primary}
            label="Track character ownership"
            checked={characterTrackingEnabled}
            onChange={(e) =>
              setCharacterTrackingEnabled(e.currentTarget.checked)
            }
          />
          {characterTrackingEnabled && (
            <Switch
              size={isMobile ? 'md' : 'sm'}
              color={accent.primary}
              label="Gray out unowned characters"
              checked={grayUnowned}
              onChange={(e) => setGrayUnowned(e.currentTarget.checked)}
            />
          )}
          <Switch
            size={isMobile ? 'md' : 'sm'}
            color={accent.primary}
            label="Show tier badges"
            checked={showCharacterTiers}
            onChange={(e) => setShowCharacterTiers(e.currentTarget.checked)}
          />
          <Switch
            size={isMobile ? 'md' : 'sm'}
            color={accent.primary}
            label="Show character skins"
            description="Display selected skins on portraits instead of default art"
            checked={skinsEnabled}
            onChange={(e) => setSkinsEnabled(e.currentTarget.checked)}
          />
          {showCharacterTiers && (
            <Select
              label="Tier List Reference"
              placeholder="Select tier list"
              data={tierListOptions}
              value={
                usingSiteDefault && siteReferenceId
                  ? SITE_DEFAULT_VALUE
                  : selectedKey || null
              }
              onChange={(value) => {
                if (!value) clearSelection();
                else if (value === SITE_DEFAULT_VALUE) followSiteDefault();
                else selectTierList(value);
              }}
              comboboxProps={selectComboboxProps}
              onDropdownOpen={() => setIsSelectDropdownOpen(true)}
              onDropdownClose={() => setIsSelectDropdownOpen(false)}
              clearable
              size={controlSize}
              disabled={loading}
            />
          )}
        </Stack>
      </Paper>

      <Paper
        p="sm"
        radius="md"
        withBorder
        style={
          isBannerDropdownOpen ? { position: 'relative', zIndex: 1 } : undefined
        }
      >
        <Group justify="space-between" align="center" mb={6}>
          <Text size="sm" fw={600}>
            Landing Banner
          </Text>
          <Badge
            size="sm"
            variant="light"
            color={
              !selectedBanner
                ? 'gray'
                : selectedBanner.type === 'video'
                  ? 'pink'
                  : 'blue'
            }
          >
            {!selectedBanner
              ? 'OFF'
              : selectedBanner.type === 'video'
                ? 'MP4'
                : 'PNG'}
          </Badge>
        </Group>
        <Select
          label="Character Illustration"
          size={controlSize}
          placeholder="Select a character illustration"
          data={bannerSelectData}
          value={bannerPreference}
          searchable
          comboboxProps={bannerComboboxProps}
          onDropdownOpen={() => {
            setIsSelectDropdownOpen(true);
            setIsBannerDropdownOpen(true);
          }}
          onDropdownClose={() => {
            setIsSelectDropdownOpen(false);
            setIsBannerDropdownOpen(false);
          }}
          nothingFoundMessage="No illustrations found"
          onChange={(value) => {
            setBannerPreference(value ?? defaultBannerValue);
          }}
        />
        <Switch
          mt="sm"
          size={isMobile ? 'md' : 'sm'}
          color={accent.primary}
          label="Show banner on all pages"
          checked={showOnAllRoutes}
          onChange={(event) => setShowOnAllRoutes(event.currentTarget.checked)}
        />
        <Switch
          mt="xs"
          size={isMobile ? 'md' : 'sm'}
          color={accent.primary}
          label="Slow scroll banner with page"
          checked={slowScrollEnabled}
          onChange={(event) =>
            setSlowScrollEnabled(event.currentTarget.checked)
          }
        />
        {randomBannerMode && (
          <Switch
            mt="xs"
            size={isMobile ? 'md' : 'sm'}
            color={accent.primary}
            label="Randomize only from favorite illustrations"
            description={
              !favoritesOnly
                ? 'Reveals a ★ button on illustrations to mark favorites'
                : favoritesMatchingCurrentMode === 0
                  ? `No favorite ${RANDOM_MODE_LABEL[randomBannerMode]}illustrations yet — falls back to all illustrations`
                  : undefined
            }
            checked={favoritesOnly}
            onChange={(event) => setFavoritesOnly(event.currentTarget.checked)}
          />
        )}
      </Paper>

      <Paper
        p="sm"
        radius="md"
        withBorder
        style={isBannerDropdownOpen ? { isolation: 'isolate' } : undefined}
      >
        <Group justify="space-between" align="center" mb={6}>
          <Text size="sm" fw={600}>
            Opacity
          </Text>
          <Button
            variant="subtle"
            color={accent.primary}
            size="compact-xs"
            onClick={resetOpacitySettings}
          >
            Reset
          </Button>
        </Group>

        <Stack gap="sm">
          <Stack gap={4}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text size="xs" fw={500}>
                Banner Media
              </Text>
              <Text size="xs" c="dimmed">
                {Math.round(bannerMediaOpacity * 100)}%
              </Text>
            </Group>
            <Slider
              color={accent.primary}
              size={isMobile ? 'md' : 'sm'}
              min={0}
              max={100}
              step={1}
              value={Math.round(bannerMediaOpacity * 100)}
              onChange={(value) => setBannerMediaOpacity(value / 100)}
              label={(value) => `${value}%`}
            />
          </Stack>

          <Stack gap={4}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text size="xs" fw={500}>
                Banner Overlay
              </Text>
              <Text size="xs" c="dimmed">
                {Math.round(bannerOverlayOpacity * 100)}%
              </Text>
            </Group>
            <Slider
              color={accent.primary}
              size={isMobile ? 'md' : 'sm'}
              min={0}
              max={100}
              step={1}
              value={Math.round(bannerOverlayOpacity * 100)}
              onChange={(value) => setBannerOverlayOpacity(value / 100)}
              label={(value) => `${value}%`}
            />
          </Stack>

          <Stack gap={4}>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text size="xs" fw={500}>
                UI Surfaces
              </Text>
              <Text size="xs" c="dimmed">
                {Math.round(surfaceOpacity * 100)}%
              </Text>
            </Group>
            <Slider
              color={accent.primary}
              size={isMobile ? 'md' : 'sm'}
              min={0}
              max={100}
              step={1}
              value={Math.round(surfaceOpacity * 100)}
              onChange={(value) => setSurfaceOpacity(value / 100)}
              label={(value) => `${value}%`}
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper p="sm" radius="md" withBorder>
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Backup &amp; Restore
          </Text>
          <Text size="xs" c="dimmed">
            Export all settings and data, then import on another device.
          </Text>
          <Group grow gap="xs">
            <Button
              variant="light"
              color={accent.primary}
              size="xs"
              leftSection={<IoDownload size={14} />}
              onClick={() => {
                handleOpenExport();
                closeOpened();
              }}
            >
              Export
            </Button>
            <Button
              variant="light"
              color={accent.primary}
              size="xs"
              leftSection={<IoFolderOpen size={14} />}
              onClick={() => {
                openImportModal();
                closeOpened();
              }}
            >
              Import
            </Button>
          </Group>
        </Stack>
      </Paper>

      <JsonModal
        mode="copy"
        title="Export Settings"
        description="Copy the text below, or download it as a file. Paste it using Import on another device."
        value={exportJson}
        filename="dragon-wiki-settings.json"
        opened={exportModalOpened}
        onClose={closeExportModal}
      />
      <JsonModal
        mode="paste"
        title="Import Settings"
        description="Paste your previously exported settings JSON below. This will overwrite your current settings and reload the page."
        placeholder={'{\n  "version": 1,\n  "data": { ... }\n}'}
        opened={importModalOpened}
        onClose={closeImportModal}
        onApply={handleImport}
        applyLabel="Import & Reload"
      />
    </Stack>
  );

  if (isMobile) {
    return (
      <>
        <ActionIcon
          variant="default"
          color={accent.primary}
          size="xl"
          aria-label="Open settings panel"
          aria-haspopup="dialog"
          onClick={toggleOpened}
        >
          <IoSettingsOutline />
        </ActionIcon>

        <MobileBottomDrawer
          opened={opened}
          onClose={closeOpened}
          title="Settings"
          closeButtonProps={{ 'aria-label': 'Close settings panel' }}
          closeOnClickOutside={!isSelectDropdownOpen}
          // When the inline (non-portaled) banner dropdown is open, allow it to
          // visually escape the scrollable container instead of being clipped.
          bodyStyle={{ overflowY: isBannerDropdownOpen ? 'visible' : 'auto' }}
        >
          {settingsContent}
        </MobileBottomDrawer>
      </>
    );
  }

  return (
    <Popover
      opened={opened}
      onDismiss={closeOpened}
      closeOnClickOutside={!isSelectDropdownOpen}
      width={380}
      position="bottom-end"
      keepMounted
      withArrow
      offset={8}
      shadow="md"
    >
      <Popover.Target>
        <Tooltip
          label="Settings"
          withArrow
          events={{ hover: true, focus: true, touch: false }}
        >
          <ActionIcon
            variant="default"
            color={accent.primary}
            size="lg"
            aria-label="Open settings panel"
            aria-haspopup="dialog"
            onClick={toggleOpened}
          >
            <IoSettingsOutline />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown
        p="md"
        style={{
          maxHeight: '70dvh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
      >
        <Stack gap="md">
          <Text size="sm" fw={700}>
            Settings
          </Text>
          <Divider />
          {settingsContent}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
