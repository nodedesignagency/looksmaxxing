/**
 * Design tokens.
 *
 * Geometry (sizes, offsets, spacing) is transcribed 1:1 from the Figma frame
 * "Skill Path" (390 x 844, node 1:118).
 *
 * Colour + typography could not be read from Figma — the MCP connection hit the
 * plan's tool-call limit after returning the node tree — so the palette below is
 * an interpretation of the frame's structure (sky gradient, clouds, sun blobs,
 * winding trail). Everything visual lives in this one file: swapping in the real
 * Figma values only ever means editing here.
 */

export const colors = {
  // Backdrop ---------------------------------------------------------------
  skyTop: '#BFE3FF',
  skyMid: '#DFF1FF',
  skyLow: '#F3FAFF',
  skyBottom: '#FFF3E2',

  sun: '#FFD08A',
  sunCore: '#FFE7BE',
  blobCool: '#A9D8FF',
  cloud: '#FFFFFF',

  // Ink --------------------------------------------------------------------
  ink: '#0F2540',
  inkMuted: '#6D869E',
  inkFaint: '#9DB2C6',

  surface: '#FFFFFF',
  surfaceSunk: '#EDF4FB',

  // Trail ------------------------------------------------------------------
  trailTrack: '#FFFFFF',
  trailDot: '#B9CFE4',
  trailDone: '#3FC77B',

  // Node states ------------------------------------------------------------
  doneFace: '#3FC77B',
  doneShadow: '#2A9E5E',
  currentFace: '#FFB020',
  currentShadow: '#D2870A',
  openFace: '#3E8BFF',
  openShadow: '#2765C4',
  lockedFace: '#E1EAF3',
  lockedShadow: '#C4D3E1',
  lockedGlyph: '#9DB2C6',

  onNode: '#FFFFFF',

  // XP ---------------------------------------------------------------------
  xpBolt: '#FFB020',
  xpText: '#B87708',
  xpChip: 'rgba(255, 176, 32, 0.16)',

  // Chrome -----------------------------------------------------------------
  chipIdle: 'rgba(255, 255, 255, 0.62)',
  chipActive: '#0F2540',
  chipActiveText: '#FFFFFF',
  chipText: '#3D5771',

  tabBar: '#FFFFFF',
  tabPill: '#EAF3FF',
  tabIdle: '#93A9BE',
  tabActive: '#0F2540',

  scrim: 'rgba(15, 37, 64, 0.42)',
} as const;

/** Frame 1:118 is 390 x 844 — the reference the Figma geometry is expressed in. */
export const DESIGN_WIDTH = 390;

export const layout = {
  /** Screen-edge gutter (title x=20, node column x=40 - 20 of node padding). */
  gutter: 20,

  /** Node frame "Frame 2147236483" — 50x50 outer, 48x48 face, 2px shadow offset. */
  nodeSize: 50,
  nodeFace: 48,
  nodeShadow: 2,

  /** Measured y-deltas between node frames: 150, 150, 151, 148. */
  nodeSpacing: 150,

  /** Node frame x positions from Figma, repeating: 40, 136, 40, 139. */
  nodeColumns: [40, 136, 40, 139],

  /** Label block "Frame 2147236475" sits at (nodeX + 58, nodeY + 5), 40 tall. */
  labelOffsetX: 58,
  labelOffsetY: 5,

  /** XP pill "Frame 2147236470" — 54x19, bolt 6x11 at (6,4), text at (16,6). */
  xpPillHeight: 19,

  /** First node frame sits at y=144, directly under the 143px-tall header block. */
  firstNodeY: 144,

  /** Header frame 1:184 is 219 tall; content ends at 143, the rest is a fade. */
  headerFadeTo: 219,

  /** Category chips row "Frame 2147236480" — 40 tall, 8px gaps, 20/10 padding. */
  chipHeight: 40,
  chipGap: 8,
  chipPadding: 10,
  chipIcon: 20,

  /** Tab bar "mainContainer" — 354x61 at (18, 763); 20px above the 844 baseline. */
  tabBarInset: 18,
  tabBarHeight: 61,
  tabBarBottomGap: 20,
  tabInner: 4,
} as const;

export const radii = {
  node: 16,
  chip: 20,
  pill: 999,
  sheet: 28,
  card: 20,
} as const;

export const type = {
  /** "Skill Path" — 105x17 text box at (20,70). */
  screenTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 24, lineHeight: 30 },
  /** Node titles — e.g. "Why Fitness Matters", 144x11. */
  nodeTitle: { fontFamily: 'Nunito_700Bold', fontSize: 15, lineHeight: 19 },
  /** "+25 XP" — 32x7. */
  xp: { fontFamily: 'Nunito_800ExtraBold', fontSize: 10, lineHeight: 12 },
  /** Chip labels — e.g. "Oral Posture", 90x11. */
  chip: { fontFamily: 'Nunito_700Bold', fontSize: 15, lineHeight: 19 },
  /** Tab labels — 78x13 boxes. */
  tab: { fontFamily: 'Nunito_700Bold', fontSize: 11, lineHeight: 14 },
  sheetTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 22, lineHeight: 28 },
  body: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, lineHeight: 21 },
  button: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, lineHeight: 20 },
} as const;

/** Spring presets — one place so every gesture in the app feels related. */
export const springs = {
  /** Snappy, for press/release on the 3D buttons. */
  press: { damping: 18, stiffness: 420, mass: 0.7 },
  /** Bouncy, for entrances and celebratory pops. */
  pop: { damping: 12, stiffness: 220, mass: 0.9 },
  /** Smooth, for sliding indicators. */
  glide: { damping: 20, stiffness: 180, mass: 0.8 },
} as const;

/**
 * Header geometry, derived from the Figma frame and re-based on the device's
 * safe-area inset (the frame's own status bar is 60px / a 59px inset).
 *
 *   title   y=70   -> topInset + 11
 *   chips   y=103  -> topInset + 44   (a 33px title row)
 *   chips end y=143 -> topInset + 84
 *   node 1  y=144  -> topInset + 85
 *
 * The background is opaque behind the header content and fades out just past
 * it, so content scrolling up vanishes at the chip baseline while the first
 * node still sits fully crisp underneath.
 */
export function headerMetrics(topInset: number) {
  const titleTop = topInset + 11;
  const titleRow = 33;
  const contentEnd = titleTop + titleRow + layout.chipHeight;
  const fade = 22;
  return {
    titleTop,
    titleRow,
    contentEnd,
    /** Full height of the painted backdrop, including the fade. */
    backdropHeight: contentEnd + fade,
    /** Where the fade begins, as a 0-1 gradient stop. */
    fadeStart: (contentEnd - 6) / (contentEnd + fade),
    firstNodeY: contentEnd + 1,
  };
}
