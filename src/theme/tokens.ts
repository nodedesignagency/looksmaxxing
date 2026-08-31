/**
 * Design tokens for the "Skill Path" frame (Figma 8f75PaORkRIvmfXHiThjdm,
 * node 1:118, 390 x 844).
 *
 * Geometry comes from the frame's layer tree. Colour and type are read off the
 * rendered frame, since the Figma MCP connection is capped on this account and
 * could not return variables or exports.
 */

export const colors = {
  // Sky --------------------------------------------------------------------
  skyTop: '#9BCCEB',
  sky: '#88C0E3',
  cloud: '#FFFFFF',

  // The road ---------------------------------------------------------------
  road: '#FFFFFF',
  /** Dashed centre line — a desaturated blue-grey on the white surface. */
  roadDash: '#C3DAEA',
  roadShadow: 'rgba(46, 96, 133, 0.14)',

  // Ink --------------------------------------------------------------------
  ink: '#1D3F55',
  inkMuted: '#7E9CB0',
  title: '#FFFFFF',

  // Node states ------------------------------------------------------------
  nodeFace: '#FFFFFF',
  nodeLocked: 'rgba(255, 255, 255, 0.42)',
  nodeLockedEdge: 'rgba(255, 255, 255, 0.55)',
  checkGlyph: '#2E5670',
  playGlyph: '#4E88AE',
  lockGlyph: '#8FAEC4',

  // "+25 XP" pill ----------------------------------------------------------
  xpChip: '#FFFFFF',
  xpChipMuted: 'rgba(255, 255, 255, 0.5)',
  xpBolt: '#3FBF6F',
  xpText: '#5F7F94',

  // Category chips ---------------------------------------------------------
  chipIdle: 'rgba(255, 255, 255, 0.32)',
  chipActive: 'rgba(255, 255, 255, 0.92)',
  chipEdge: 'rgba(255, 255, 255, 0.5)',

  // Tab bar ----------------------------------------------------------------
  tabBar: '#FFFFFF',
  tabPill: '#DCEBF7',
  tabIdle: '#1D3F55',
  tabActive: '#4E88AE',

  surface: '#FFFFFF',
  scrim: 'rgba(18, 52, 74, 0.4)',
} as const;

/** The frame the geometry below is expressed in. */
export const DESIGN_WIDTH = 390;

export const layout = {
  /** Title x=20; the node column starts at x=40. */
  gutter: 20,

  /** "Frame 2147236483" — a 50x50 frame holding a 48x48 circular face. */
  nodeSize: 50,
  nodeFace: 48,

  /** Measured y-deltas between node frames: 150, 150, 151, 148. */
  nodeSpacing: 150,

  /** Node frame x positions, repeating: 40, 136, 40, 139. */
  nodeColumns: [40, 136, 40, 139],

  /** Label block "Frame 2147236475" at (nodeX + 58, nodeY + 5), 40 tall. */
  labelOffsetX: 58,
  labelOffsetY: 5,

  /** "Frame 2147236470" — the 54x19 XP pill. */
  xpPillHeight: 19,

  /** Category chips — 40 tall, 8px apart, 10px padding, 20x20 icon. */
  chipHeight: 40,
  chipGap: 8,
  chipPadding: 10,
  chipIcon: 20,

  /** "mainContainer" — 354x61 at (18, 763), 20px above the 844 baseline. */
  tabBarInset: 18,
  tabBarHeight: 61,
  tabBarBottomGap: 20,
  tabInner: 4,
} as const;

/**
 * The road ("Vector 4915" / "Vector 4916", bounds x 75.5 -> 315).
 *
 * It snakes between two columns in rounded switchbacks, crossing over at the
 * midpoint between each pair of nodes. The nodes themselves sit beside it, in
 * whichever column the road is not currently occupying.
 */
export const road = {
  width: 38,
  /** Centre lines: 75.5 + width/2, and 315 - width/2. */
  leftX: 94.5,
  rightX: 296,
  /** Corner radius of each switchback. */
  corner: 50,
  dash: { width: 3.5, on: 14, off: 15 },
} as const;

export const radii = {
  /** Nodes are circles: half of the 48px face. */
  node: 24,
  chip: 20,
  pill: 999,
  sheet: 28,
  card: 18,
} as const;

/**
 * System font throughout — the frame's type is a neutral grotesque, which is
 * what San Francisco / Roboto already are on the two target platforms.
 */
export const type = {
  /** "Skill Path" — a 105x17 text box at (20, 70). */
  screenTitle: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  /** Node titles, e.g. "Beginner Body weight" at 156x11. */
  nodeTitle: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  /** "+25 XP" at 32x7. */
  xp: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  /** Chip labels, e.g. "Oral Posture" at 90x11. */
  chip: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  /** Tab labels in 78x13 boxes. */
  tab: { fontSize: 12, lineHeight: 15, fontWeight: '600' },
  sheetTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  button: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
} as const;

/** Spring presets, so every gesture in the app feels related. */
export const springs = {
  press: { damping: 18, stiffness: 420, mass: 0.7 },
  pop: { damping: 12, stiffness: 220, mass: 0.9 },
  glide: { damping: 20, stiffness: 180, mass: 0.8 },
} as const;

/**
 * Header geometry, re-based on the device inset (the frame's own status bar is
 * 60px tall, i.e. a 59px inset).
 *
 *   title     y=70  -> topInset + 11
 *   chips     y=103 -> topInset + 44
 *   chips end y=143 -> topInset + 84
 *   node 1    y=144 -> topInset + 85
 *
 * "Frame 2147236479" is 219 tall — 76px of it past the chips. That overhang is
 * a scrim fading into the sky, which is why the first node reads as hazy in the
 * design rather than fully crisp.
 */
export function headerMetrics(topInset: number) {
  const titleTop = topInset + 11;
  const titleRow = 33;
  const contentEnd = titleTop + titleRow + layout.chipHeight;
  return {
    titleTop,
    titleRow,
    contentEnd,
    /** Full 219px header block, re-based on the inset. */
    scrimHeight: topInset + 160,
    firstNodeY: contentEnd + 1,
  };
}
