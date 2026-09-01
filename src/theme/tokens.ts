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
  sky: '#8CC2E4',
  cloud: '#FFFFFF',

  // The road ---------------------------------------------------------------
  road: '#FFFFFF',
  /** Dashed centre line, reusing the chip blue. */
  roadDash: '#C3DDEF',
  roadShadow: 'rgba(88, 138, 171, 0.16)',

  // Ink --------------------------------------------------------------------
  /** Chip and tab labels. */
  ink: '#000000',
  /** Node titles. */
  nodeTitle: '#10334A',
  /** Labels under the header scrim and on locked nodes. */
  inkMuted: '#5F86A2',
  title: '#FFFFFF',

  /**
   * Node circles ("circle" frame: a 48x48 face at 0,0 over an identical 48x48
   * plate at 2,2). Face, plate and glyph are the only two colours in the group.
   */
  nodeFace: '#FFFFFF',
  nodePlate: '#588AAB',
  nodeGlyph: '#588AAB',
  nodeFaceLocked: 'rgba(255, 255, 255, 0.5)',
  nodePlateLocked: 'rgba(88, 138, 171, 0.38)',
  nodeGlyphLocked: 'rgba(88, 138, 171, 0.65)',

  // "+25 XP" pill ----------------------------------------------------------
  xpChip: '#FFFFFF',
  xpChipMuted: 'rgba(255, 255, 255, 0.55)',
  /** Bolt and label are both this green. */
  xpGreen: '#10AB6E',
  /** Success panel, built from the XP green. */
  successTint: '#E4F7EF',
  successEdge: '#0B8256',

  // Category chips ---------------------------------------------------------
  chipIdle: '#C3DDEF',
  chipActive: '#F6FAFF',
  /** ECF0F9 — full strength on the selected chip, half on the rest. */
  chipEdge: '#ECF0F9',
  chipEdgeIdle: 'rgba(236, 240, 249, 0.5)',

  // Tab bar ----------------------------------------------------------------
  tabBar: '#FFFFFF',
  tabPill: '#E4EEF7',
  tabIdle: '#000000',
  tabActive: '#588AAB',

  surface: '#FFFFFF',
  scrim: 'rgba(18, 52, 74, 0.4)',
} as const;

/** The frame the geometry below is expressed in. */
export const DESIGN_WIDTH = 390;

export const layout = {
  /** Title x=20; the node column starts at x=40. */
  gutter: 20,

  /**
   * "circle" — a 50x50 frame holding two 48x48 children: the white face at
   * (0,0) and a #588AAB plate at (2,2) showing through as the depth edge.
   */
  nodeSize: 50,
  nodeFace: 48,
  nodePlateOffset: 2,

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
  chipGapInner: 6,
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
  /** The frame sets 30 on a 48px face and 38 on a 40px chip; both fully round. */
  node: layout.nodeFace / 2,
  chip: layout.chipHeight / 2,
  /** "tabPills" is radius 9999 — a full stadium. */
  tabBar: layout.tabBarHeight / 2,
  tabPill: (layout.tabBarHeight - 8) / 2,
  pill: 999,
  sheet: 28,
  card: 18,
} as const;

/**
 * Geist, the family the Figma file uses. Weights are named rather than numeric
 * because React Native picks a face by family name, not by fontWeight, once a
 * custom font is loaded.
 */
export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semiBold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

export const type = {
  /** "Skill Path" — a 105x17 text box at (20, 70). */
  screenTitle: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32 },
  /** Node titles — Geist Regular 16, tracking -2%. */
  nodeTitle: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 20, letterSpacing: -0.32 },
  /** "+25 XP" — Geist Regular 10, tracking -2.8%. */
  xp: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 13, letterSpacing: -0.28 },
  /** Chip labels, e.g. "Oral Posture" at 90x11. */
  chip: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 20, letterSpacing: -0.32 },
  /** Tab labels in 78x13 boxes. */
  tab: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, letterSpacing: -0.26 },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  button: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, letterSpacing: 0.8 },
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
