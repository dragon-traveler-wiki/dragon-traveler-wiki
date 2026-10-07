import { Box, Group, ScrollArea, UnstyledButton } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { TRANSITION, Z_INDEX } from '@/constants/ui';
import { useGradientAccent } from '@/hooks';

export interface JumpSection {
  id: string;
  label: string;
}

interface SectionJumpNavProps {
  sections: JumpSection[];
  /** Mantine breakpoint at and above which the nav is hidden. */
  hiddenFrom?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const ACTIVE_THRESHOLD_PX = 24;

/**
 * Sticky, horizontally scrollable row of section links for long pages.
 * Sections whose element isn't rendered are skipped.
 */
export default function SectionJumpNav({
  sections,
  hiddenFrom,
}: SectionJumpNavProps) {
  const { accent } = useGradientAccent();
  const reduceMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingCorrectionRef = useRef<AbortController | null>(null);
  const [available, setAvailable] = useState<JumpSection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sectionsKey = sections.map((s) => s.id).join('|');
  // Layout effect so the nav is in place before first paint instead of
  // pushing the content down a frame later.
  useLayoutEffect(() => {
    // Sections render conditionally (and some only after data loads), so
    // re-check which targets exist whenever the DOM settles.
    const update = () =>
      setAvailable((prev) => {
        const next = sections.filter((s) => document.getElementById(s.id));
        const same =
          next.length === prev.length &&
          next.every((s, i) => s.id === prev[i].id);
        return same ? prev : next;
      });
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsKey]);

  // Where the nav's bottom edge sits once it's stuck under the header. Using
  // its current position would be wrong while it's still below the hero.
  const getOffset = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return 0;
    return parseFloat(getComputedStyle(nav).top) + nav.offsetHeight;
  }, []);

  useEffect(() => () => pendingCorrectionRef.current?.abort(), []);

  useEffect(() => {
    if (available.length === 0) return;
    let frame = 0;
    const updateActive = () => {
      frame = 0;
      const offset = getOffset() + ACTIVE_THRESHOLD_PX;
      let current: string | null = null;
      for (const { id } of available) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset) current = id;
      }
      // The last sections may be too short to reach the nav, so treat the
      // bottom of the page as being in the final section.
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      if (atBottom) current = available[available.length - 1].id;
      setActiveId(current ?? available[0].id);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateActive);
    };
    updateActive();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [available, getOffset]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const chip = activeId ? chipRefs.current.get(activeId) : undefined;
    if (!viewport || !chip) return;
    // Scroll only the chip row; scrollIntoView would also nudge the window
    // and cancel an in-progress smooth scroll.
    const left =
      chip.offsetLeft - (viewport.clientWidth - chip.offsetWidth) / 2;
    viewport.scrollTo({ left, behavior: 'smooth' });
  }, [activeId]);

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const behavior = reduceMotion ? 'auto' : 'smooth';
    const getTargetTop = () =>
      Math.min(
        el.getBoundingClientRect().top + window.scrollY - getOffset() - 8,
        document.documentElement.scrollHeight - window.innerHeight,
      );
    pendingCorrectionRef.current?.abort();
    const top = getTargetTop();
    if (Math.abs(top - window.scrollY) <= 2) return;
    window.scrollTo({ top, behavior });
    // Lazy-loaded media above the target can shift it mid-scroll; correct
    // once the scroll settles.
    const controller = new AbortController();
    pendingCorrectionRef.current = controller;
    window.addEventListener(
      'scrollend',
      () => {
        pendingCorrectionRef.current = null;
        const corrected = getTargetTop();
        if (Math.abs(corrected - window.scrollY) > 2) {
          window.scrollTo({ top: corrected, behavior });
        }
      },
      { once: true, signal: controller.signal },
    );
  };

  if (available.length < 2) return null;

  return (
    <Box
      component="nav"
      ref={navRef}
      aria-label="Page sections"
      hiddenFrom={hiddenFrom}
      className="dt-themed-surface"
      style={{
        position: 'sticky',
        top: 'var(--app-shell-header-offset, 0px)',
        zIndex: Z_INDEX.STICKY,
        borderBottom: '1px solid var(--mantine-color-default-border)',
        marginInline: 'calc(var(--mantine-spacing-md) * -1)',
        marginBottom: 'var(--mantine-spacing-md)',
      }}
    >
      <ScrollArea type="never" scrollbars="x" viewportRef={viewportRef}>
        {/* Size the row to its chips so the trailing padding scrolls with them
            instead of staying pinned to the viewport edge. */}
        <Group
          gap={6}
          wrap="nowrap"
          px="md"
          py={8}
          style={{ width: 'max-content', minWidth: '100%' }}
        >
          {available.map(({ id, label }) => {
            const isActive = id === activeId;
            return (
              <UnstyledButton
                key={id}
                ref={(el) => {
                  if (el) chipRefs.current.set(id, el);
                  else chipRefs.current.delete(id);
                }}
                onClick={() => jumpTo(id)}
                aria-current={isActive ? 'location' : undefined}
                style={{
                  flexShrink: 0,
                  minHeight: 32,
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 'var(--mantine-font-size-sm)',
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: 'nowrap',
                  color: isActive
                    ? `var(--mantine-color-${accent.primary}-light-color)`
                    : 'var(--mantine-color-dimmed)',
                  background: isActive
                    ? `var(--mantine-color-${accent.primary}-light)`
                    : 'transparent',
                  transition: `background ${TRANSITION.FAST} ${TRANSITION.EASE}, color ${TRANSITION.FAST} ${TRANSITION.EASE}`,
                }}
              >
                {label}
              </UnstyledButton>
            );
          })}
        </Group>
      </ScrollArea>
    </Box>
  );
}
