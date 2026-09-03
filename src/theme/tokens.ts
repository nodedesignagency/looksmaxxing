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
  /** Interior arcs that give the panel's cloud edge its depth. */
  cloudDepth: '#E3EDF5',
  cloudDepthSuccess: '#A9E0C6',

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

  // Home ("Home", node 23:10380) --------------------------------------------
  /**
   * The Figma MCP connection is capped on this account, so `get_design_context`
   * and `get_variable_defs` both refuse and the file's own variables could not
   * be read. Geometry below and in the components is exact — one `get_metadata`
   * call did return, and every position and size comes from it. These colours
   * did not: they are read off the rendered frame, and where the frame clearly
   * reuses a colour the Skill Path screen already has, they point at it rather
   * than restating a near-miss.
   */
  /** The sheet the lower two thirds of the screen sits on. */
  sheet: '#FFFFFF',
  /**
   * Streak card. Read off the inspector, not the render: it is an opaque
   * F6FAFF card holding a white plate, both with the same hairline stroke.
   *
   * It looked frosted in the comp and was built that way, which was wrong —
   * F6FAFF over this sky reads as glass without being any, and the giveaway is
   * that the cloud behind it never actually moves through it.
   */
  streakPlate: '#F6FAFF',
  streakInner: '#FFFFFF',
  /** The 1px inside stroke on both, and on the level card. */
  cardStroke: '#ECF0F9',
  /**
   * The gem pill has no colours of its own: it is Figma's Glass material, run
   * as a shader on the sky behind it. See `components/home/glassShader.ts`.
   */
  /** Greeting: both lines white on the sky, the light one a shade back. */
  greeting: 'rgba(255, 255, 255, 0.9)',
  greetingHeavy: '#FFFFFF',
  /** Headings, off the inspector: plain black, not a navy. */
  heading: '#000000',
  /** Week strip. */
  dayLabel: '#8B8B8B',
  dayLabelToday: '#000000',
  dayTick: '#DFECF7',
  /** Today's marker under its date, and the "CURRENT STREAK" label. */
  todayDot: '#426F90',
  streakLabel: '#426F90',
  streakDays: '#000000',
  /** Level card, built from the same green as the XP pills. */
  levelCard: '#E4F7EF',
  levelTrack: '#BFE9D6',
  levelFill: '#10AB6E',
  /** "95/120 XP" is a muted green ink, not the bright green of its bolt. */
  levelXpInk: '#3B5E51',
  levelLocked: '#CFFFEC',
  /** Both badges carry a white inside stroke and a green glow under them. */
  levelBadgeEdge: '#FFFFFF',
  levelBadgeGlow: '#62FF51',
  /** Quest rows and their two states. */
  questRow: '#F6FAFF',
  /** Row titles, off the inspector: plain black. */
  questTitle: '#000000',
  questBody: '#97A6B4',
  questDone: '#4284B4',
  /** The mark's own glow, clipped by the row it sits in. */
  questDoneGlow: '#51BFFF',
  questPending: '#BCD4E6',
  /** The quest ring's track — paler than the dashed ring on a pending row. */
  ringTrack: '#DFEEF7',
  /** The pale disc the frame sets each quest sprite on. */
  questIconPlate: 'rgba(255, 255, 255, 0.75)',
  /** Gems, the second currency beside XP. */
  gem: '#C13FE0',
  gemDark: '#8E1FA8',
  /** The streak medal. */
  medal: '#F5B324',
  medalDeep: '#E08A16',
  medalPale: '#FFE59A',
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

  /**
   * Home ("Home", node 23:10380). Every number here is off the node tree.
   *
   *   greeting row   350x42 at (20, 70)
   *   streak card    350x166 at (20, 128), inner plate 330x88 at (10, 10)
   *   week strip     330x56 at (10, 104), seven 44x56 cells 3.67 apart
   *   sheet          390x673 at (0, 310)
   *   level card     350x99 at (20, 20) of the sheet
   *   quest block    350x497 at (20, 135) of the sheet
   *   quest row      342x81, 4 apart, content 318x57 inset 12
   */
  homeGutter: 20,
  streakCard: 166,
  streakPlate: 88,
  /** 10 on three sides, 6 under the week strip, 6 between the two children. */
  streakPad: 10,
  streakPadBottom: 6,
  streakGap: 6,
  /** The white plate's own padding, and the gap to the medal. */
  streakInnerPad: 14,
  streakInnerGap: 16,
  weekStrip: 56,
  weekCell: 44,
  weekGap: 3.67,
  weekTick: 20,
  sheetTop: 310,
  levelCard: 99,
  levelPad: 12,
  levelBadge: { width: 30, height: 20 },
  levelTrackHeight: 6,
  questRow: 81,
  questRowGap: 4,
  questPad: 12,
  questIcon: 32,
  questStatus: 24,
  questTextLeft: 40,

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
  /** Home: the sheet's top corners, its cards, and a quest row. */
  homeSheet: 32,
  /** Straight off the inspector: 12 on the streak card, 8 on its white plate. */
  homeCard: 12,
  homeInner: 8,
  levelCard: 16,
  questCard: 16,
  questRow: 12,
} as const;

/**
 * Geist, the family the Figma file uses. Weights are named rather than numeric
 * because React Native picks a face by family name, not by fontWeight, once a
 * custom font is loaded.
 */
export const fonts = {
  /** The one non-Geist face in the file: "CURRENT STREAK". */
  dmSans: 'DMSans_400Regular',
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semiBold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

export const type = {
  /** "Skill Path" — Geist SemiBold 24, tracking -2%, in a 105x17 box. */
  screenTitle: { fontFamily: fonts.semiBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.48 },
  /** Node titles — Geist Regular 16, tracking -2%. */
  nodeTitle: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 20, letterSpacing: -0.32 },
  /** "+25 XP" — Geist Regular 10, tracking -2.8%. */
  xp: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 13, letterSpacing: -0.28 },
  /** Chip labels, e.g. "Oral Posture" at 90x11. */
  chip: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 20, letterSpacing: -0.32 },
  /** Tab labels in 78x13 boxes. */
  tab: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 16, letterSpacing: -0.26 },
  /**
   * Home.
   *
   * Four of these are read straight off the inspector, and are marked so. The
   * rest are solved: the node tree gives every text layer's box width, so each
   * string was rendered in Geist at a known size, measured, and the size scaled
   * by the ratio to the frame's width. That is what caught "Welcome Back": at
   * 24 it runs 165 wide against the frame's 136, so the frame's is 20 and the
   * first pass was a fifth too big.
   *
   * The comment after each is the frame's box width for that string.
   *
   * Solving recovers a size but not a weight, and the two trade off: a heavier
   * face is wider, so guessing SemiBold where the frame has Medium solves to a
   * size a little too small. Every inspector reading so far has come back
   * Medium and a half-point to a point larger, which is exactly that error —
   * so treat the remaining solved weights as the least certain thing here.
   */
  greeting: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 20, letterSpacing: -0.3 }, // 71
  welcome: { fontFamily: fonts.semiBold, fontSize: 20, lineHeight: 25, letterSpacing: -0.4 }, // 136
  gemCount: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 21, letterSpacing: -0.3 }, // 30
  /** DM Sans Regular 14, tracking -0.392, uppercase. Not Geist, and not 11.5. */
  streakLabel: {
    fontFamily: fonts.dmSans,
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: -0.392,
  },
  /** Geist *Medium* 32, tracking -0.32 — medium, not bold. */
  streakDays: { fontFamily: fonts.medium, fontSize: 32, lineHeight: 36, letterSpacing: -0.32 },
  dayLabel: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 14 },
  dayNumber: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 20 },
  /** Inspector: Geist Medium 18, tracking -2%, #000000. */
  levelTitle: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 22, letterSpacing: -0.36 }, // 59
  /** Inspector: Geist Regular 14, tracking -2.8%, #3B5E51. */
  levelXp: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 17, letterSpacing: -0.392 }, // 66
  /** Sized so the widest label, "150 XP", fits its 37 rather than "30 XP" does. */
  levelStep: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 14, letterSpacing: -0.2 }, // 37
  /** Inspector: Geist Medium 18, tracking -2%, #000000. Not Bold 17.5. */
  questHeading: { fontFamily: fonts.medium, fontSize: 18, lineHeight: 22, letterSpacing: -0.36 }, // 114
  questSub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 17, letterSpacing: -0.2 }, // 158
  /**
   * The row's body copy, a shade larger than what exactly fills its 242 — which
   * is what truncates it at "and Sham…" the way the frame does.
   */
  questBody: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 17, letterSpacing: -0.2 }, // 242
  questCount: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 13, letterSpacing: -0.1 }, // 69
  /** Inspector: Geist Medium 16, tracking -2%, #000000. */
  questTitle: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 20, letterSpacing: -0.32 }, // 186
  questReward: { fontFamily: fonts.medium, fontSize: 11.5, lineHeight: 14, letterSpacing: -0.2 }, // 38
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
  // The frame butts the first node straight against the chips, which leaves it
  // sitting in the strongest part of the scrim and half-read. The scrim now
  // finishes sooner and the first node starts where it finishes, so it opens
  // fully visible.
  const scrimHeight = topInset + 128;
  return {
    titleTop,
    titleRow,
    contentEnd,
    scrimHeight,
    firstNodeY: scrimHeight,
  };
}
