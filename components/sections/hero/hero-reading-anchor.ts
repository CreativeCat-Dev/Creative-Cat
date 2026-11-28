/**
 * Reading anchor for the hero's effective-mode transition.
 *
 * The enhanced wrapper is 500svh. When the controller demotes to static the
 * document collapses by thousands of pixels and the browser clamps the restored
 * scroll position to the new document end, which moves a visitor from the hero
 * into the footer. The clamp is correct for the document but wrong for the
 * reader, so `HeroStory` preserves one semantic anchor instead of the absolute
 * scroll coordinate.
 *
 * This module is policy, not a scroll manager. It only reads geometry and picks
 * an element; it holds no state, listeners, clocks or scroll calls. `HeroStory`
 * captures before a footprint change, re-measures the same connected element
 * afterwards, and performs at most one immediate correction.
 */

export type ReadingAnchor = {
  element: Element;
  /** Viewport-relative top at capture, in CSS pixels. */
  viewportTop: number;
  /** Best persistent semantic element if the primary one unmounts. */
  fallback: { element: Element; viewportTop: number } | null;
};

const HERO_SELECTOR =
  "[data-hero-copy], #hero-title, [data-hero-body], [data-hero-cta], [data-hero-meta]";

const CONTENT_SELECTOR = "h1, h2, h3, h4, h5, h6, p, li, a[href], button";

/**
 * Chrome and overlays are never reading anchors: the navbar is fixed, and the
 * menu panel is a dialog above the page. `aria-hidden`/`hidden` cover decorative
 * artwork and collapsed mobile branches.
 */
const CHROME_SELECTOR =
  "header, dialog, [role='dialog'], [aria-hidden='true'], [hidden], script, style";

const FOCUSABLE_SELECTOR =
  "a[href], button, input, select, textarea, summary, [tabindex]";

/**
 * The reading line sits in the upper third, where a reader's eye starts a new
 * screen. A candidate that contains the line wins over one that merely sits
 * near it, so the anchor is what the visitor is looking at rather than the
 * topmost sliver of a section that is leaving.
 */
const READING_LINE_RATIO = 0.28;
const READING_LINE_MAX = 220;

type Candidate = {
  element: Element;
  viewportTop: number;
  bottom: number;
  /** Lower is preferred when two candidates are equally close to the line. */
  weight: number;
  area: number;
};

const isRendered = (element: Element): boolean => {
  if (!element.isConnected) return false;
  if (element.closest(CHROME_SELECTOR)) return false;
  const rect = element.getBoundingClientRect();
  return (
    rect.width > 1 &&
    rect.height > 1 &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight
  );
};

const candidateFor = (element: Element, weight: number): Candidate | null => {
  if (!isRendered(element)) return null;
  const rect = element.getBoundingClientRect();
  return {
    element,
    viewportTop: rect.top,
    bottom: rect.bottom,
    weight,
    area: rect.width * rect.height,
  };
};

const contentWeight = (element: Element): number => {
  if (/^H[1-6]$/.test(element.tagName)) return 1;
  if (element.tagName === "P" || element.tagName === "LI") return 2;
  return 3;
};

const readingLine = () =>
  Math.min(window.innerHeight * READING_LINE_RATIO, READING_LINE_MAX);

const distanceToLine = (candidate: Candidate, line: number): number => {
  if (candidate.viewportTop <= line && candidate.bottom >= line) return 0;
  return Math.min(
    Math.abs(candidate.viewportTop - line),
    Math.abs(candidate.bottom - line)
  );
};

const byReadingPosition = (line: number) => (a: Candidate, b: Candidate) => {
  const distance = distanceToLine(a, line) - distanceToLine(b, line);
  if (distance !== 0) return distance;
  if (a.weight !== b.weight) return a.weight - b.weight;
  if (a.area !== b.area) return a.area - b.area;
  if (a.element === b.element) return 0;
  return a.element.compareDocumentPosition(b.element) &
    Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1;
};

const collectCandidates = (wrapper: Element): Candidate[] => {
  const candidates: Candidate[] = [];

  wrapper.querySelectorAll(HERO_SELECTOR).forEach((element) => {
    const candidate = candidateFor(element, 0);
    if (candidate) candidates.push(candidate);
  });

  document.querySelectorAll(CONTENT_SELECTOR).forEach((element) => {
    // Hero content is curated above; corridor cards are a deliberate exclusion
    // because they are decorative and mode-volatile.
    if (element.closest("[data-hero-story]")) return;
    const candidate = candidateFor(element, contentWeight(element));
    if (candidate) candidates.push(candidate);
  });

  return candidates;
};

const focusedCandidate = (): Candidate | null => {
  const active = document.activeElement;
  if (!active || active === document.body || active === document.documentElement) {
    return null;
  }
  if (!(active instanceof Element)) return null;
  if (!active.matches(FOCUSABLE_SELECTOR)) return null;
  return candidateFor(active, -1);
};

/**
 * Pick the element the visitor is reading and record its viewport offset.
 *
 * Priority: a visible focused control, then the semantic element at the reading
 * line (hero copy/headline first, then the next section, then the footer). A
 * persistent fallback is recorded in the same pass so a focused control that
 * unmounts on demotion cannot strand the correction.
 */
export function captureReadingAnchor(wrapper: Element): ReadingAnchor | null {
  const line = readingLine();
  const candidates = collectCandidates(wrapper).sort(byReadingPosition(line));
  const focused = focusedCandidate();
  const primary = focused ?? candidates[0] ?? null;
  if (!primary) return null;

  const fallbackCandidate =
    candidates.find((candidate) => candidate.element !== primary.element) ??
    null;

  return {
    element: primary.element,
    viewportTop: primary.viewportTop,
    fallback: fallbackCandidate
      ? {
          element: fallbackCandidate.element,
          viewportTop: fallbackCandidate.viewportTop,
        }
      : null,
  };
}

const isLive = (element: Element) =>
  element.isConnected && element.getClientRects().length > 0;

/** Re-resolve the captured element after the footprint change. */
export function resolveReadingAnchor(
  anchor: ReadingAnchor | null
): { element: Element; viewportTop: number } | null {
  if (!anchor) return null;
  if (isLive(anchor.element)) {
    return { element: anchor.element, viewportTop: anchor.viewportTop };
  }
  if (anchor.fallback && isLive(anchor.fallback.element)) {
    return anchor.fallback;
  }
  return null;
}
