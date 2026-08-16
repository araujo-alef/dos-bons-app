/**
 * Layout constants shared between the rendered page (BookPage) and the
 * off-screen pagination measurer (BookMeasurer).
 *
 * These MUST stay in one place: the measurer decides where pages break by
 * measuring against the same box the real page renders into. If the two
 * ever disagree about how much vertical room the toolbar takes, pagination
 * silently packs text into space that doesn't exist and the last paragraph
 * gets clipped (overflow:hidden gives no scroll, no warning).
 */

/**
 * Vertical space reserved at the bottom of every page for the reader
 * toolbar, which floats over the page.
 *
 * Breakdown for the expanded toolbar (its only state right now):
 *   18px  — the toolbar's own offset from the bottom (see ReaderToolbar)
 *   ~58px — its rendered height: 6px×2 container padding + 1px×2 border +
 *           button content (13px icon + 4px gap + 9px label + 8px×2 padding
 *           + 1px×2 border)
 *   12px  — breathing room so text never sits flush against it
 */
export const TOOLBAR_CLEARANCE_PX = 88;

/** The same value as a CSS length, including the iOS safe-area inset. */
export const TOOLBAR_CLEARANCE_CSS = `calc(${TOOLBAR_CLEARANCE_PX}px + env(safe-area-inset-bottom, 0px))`;
