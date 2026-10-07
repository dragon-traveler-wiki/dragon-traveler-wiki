import { GITHUB_REPO_URL } from '@/constants/github';
import { getGlassStyles } from '@/constants/glass';
import { ICON_TEXT_FLEX_STYLE } from '@/constants/styles';
import { IMAGE_SIZE, PAGE_WIDTH } from '@/constants/ui';
import { useDarkMode, useGradientAccent } from '@/hooks';
import {
  Anchor,
  Box,
  Collapse,
  Container,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { useState } from 'react';
import { Link } from 'react-router';
import {
  IoBulb,
  IoChevronDown,
  IoChevronUp,
  IoLogoGithub,
  IoWarning,
} from 'react-icons/io5';

const DATA_SOURCE_URL = 'https://www.gamekee.com/lhlr/';

const LEGAL_DISCLAIMER =
  'This is an unofficial, fan-run wiki and is not affiliated with or endorsed by GameTree. Dragon Traveler names, assets, and related intellectual property belong to GameTree.';

export default function Footer() {
  const [showLegal, setShowLegal] = useState(false);
  const isDark = useDarkMode();
  const { accent } = useGradientAccent();
  const glassStyles = getGlassStyles(isDark, true);
  const currentYear = new Date().getFullYear();
  const accentColor = `${accent.primary}.${isDark ? 3 : 7}`;

  const footerLinks = [
    {
      label: 'GitHub',
      href: GITHUB_REPO_URL,
      icon: <IoLogoGithub size={IMAGE_SIZE.ICON_LG} aria-hidden="true" />,
    },
    {
      label: 'Report Issue',
      href: `${GITHUB_REPO_URL}/issues/new?labels=bug`,
      icon: <IoWarning size={IMAGE_SIZE.ICON_LG} aria-hidden="true" />,
    },
    {
      label: 'Suggest',
      href: `${GITHUB_REPO_URL}/issues/new?labels=enhancement`,
      icon: <IoBulb size={IMAGE_SIZE.ICON_LG} aria-hidden="true" />,
    },
  ];

  return (
    <Box
      component="footer"
      mt="lg"
      style={{
        ...glassStyles,
        border: 'none',
        borderTop: glassStyles.border,
        marginLeft: 'calc(-1 * var(--app-shell-padding))',
        marginRight: 'calc(-1 * var(--app-shell-padding))',
        marginBottom: 'calc(-1 * var(--app-shell-padding))',
        paddingTop: 'var(--mantine-spacing-md)',
        paddingBottom: 'var(--mantine-spacing-md)',
      }}
    >
      <Container size={PAGE_WIDTH.WIDE}>
        <Stack gap="sm" align="center">
          <Group justify="center" gap="md" wrap="wrap">
            {footerLinks.map((link) => (
              <Anchor
                key={link.label}
                href={link.href}
                aria-label={link.label}
                c={accentColor}
                underline="hover"
                size="sm"
                target="_blank"
                rel="noopener noreferrer"
                style={ICON_TEXT_FLEX_STYLE}
              >
                {link.icon}
                <Text span fw={500}>
                  {link.label}
                </Text>
              </Anchor>
            ))}
          </Group>

          <Group gap="xs" justify="center" wrap="wrap">
            <Text size="xs" c="dimmed">
              © {currentYear} Dragon Traveler Wiki
            </Text>

            <Text size="xs" c="dimmed" aria-hidden="true">
              •
            </Text>

            <Text size="xs" c="dimmed" fs="italic">
              Unofficial fan project
            </Text>

            <Text size="xs" c="dimmed" aria-hidden="true" visibleFrom="xs">
              •
            </Text>

            <Anchor
              component="button"
              type="button"
              onClick={() => setShowLegal((value) => !value)}
              aria-expanded={showLegal}
              aria-controls="footer-legal"
              c={accentColor}
              size="sm"
              fw={500}
              style={ICON_TEXT_FLEX_STYLE}
            >
              {showLegal ? <IoChevronUp /> : <IoChevronDown />}
              Legal & Sources
            </Anchor>
          </Group>

          <Collapse expanded={showLegal} id="footer-legal">
            <Stack gap="xs" align="center" pt="xs">
              <Text size="xs" c="dimmed" ta="center" maw={600}>
                {LEGAL_DISCLAIMER}
              </Text>
              <Text size="xs" c="dimmed">
                Data source:{' '}
                <Anchor
                  href={DATA_SOURCE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  c={accentColor}
                >
                  GameKee Wiki
                </Anchor>
              </Text>
              <Group gap={4} justify="center">
                <Anchor
                  component={Link}
                  to="/community-guidelines"
                  size="xs"
                  c={accentColor}
                >
                  Community Guidelines
                </Anchor>
                <Text size="xs" c="dimmed">
                  •
                </Text>
                <Anchor
                  component={Link}
                  to="/privacy"
                  size="xs"
                  c={accentColor}
                >
                  Privacy Policy
                </Anchor>
              </Group>
            </Stack>
          </Collapse>
        </Stack>
      </Container>
    </Box>
  );
}
