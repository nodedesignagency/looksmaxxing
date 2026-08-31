import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

/**
 * The Figma frame references the Solar icon set by name — `solar:play-bold`,
 * `Linear / Essentional, UI / Home Angle`, `Linear / Shopping, Ecommerce / Cart
 * Large`, `Linear / Business, Statistic / Chart 2`, `Interface / Check`.
 *
 * Those layers are instances we could not export (the Figma MCP tool-call limit
 * was reached), so these are hand-authored on Solar's 24x24 grid using its
 * house style: 1.6px strokes, round caps and joins, for the "Linear" variants.
 */

export type GlyphProps = {
  size?: number;
  color?: string;
  /** Stroke weight for linear glyphs, on the 24px grid. */
  weight?: number;
};

const linear = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
});

export const HomeAngleIcon = ({ size = 24, color = '#000', weight = 1.6 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Path
      d="M2 12.204c0-2.289 0-3.433.519-4.381.519-.949 1.468-1.538 3.365-2.715l2-1.241C9.889 2.622 10.892 2 12 2s2.111.622 4.116 1.867l2 1.241c1.897 1.177 2.846 1.766 3.365 2.715.519.948.519 2.092.519 4.381v1.521c0 3.901 0 5.851-1.172 7.063C19.657 22 17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.212C2 19.576 2 17.626 2 13.725v-1.521Z"
      stroke={color}
      strokeWidth={weight}
      strokeLinejoin="round"
    />
    <Path d="M12 15v3" stroke={color} strokeWidth={weight} strokeLinecap="round" />
  </Svg>
);

/** Winding trail with a start dot and an end marker — the Skill Path tab. */
export const RouteIcon = ({ size = 24, color = '#000', weight = 1.6 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Path
      d="M6.5 19.5h4.75a3.25 3.25 0 0 0 0-6.5h-3.5a3.25 3.25 0 0 1 0-6.5h4.75"
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={5} cy={19.5} r={2.1} stroke={color} strokeWidth={weight} />
    <Path
      d="M19 4.2c1.24 0 2.25 1.03 2.25 2.3 0 1.72-1.62 3.42-2.25 4.02-.63-.6-2.25-2.3-2.25-4.02 0-1.27 1.01-2.3 2.25-2.3Z"
      stroke={color}
      strokeWidth={weight}
      strokeLinejoin="round"
    />
  </Svg>
);

export const CartIcon = ({ size = 24, color = '#000', weight = 1.6 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Path
      d="M2.5 3h.86c.6 0 1.12.42 1.24 1.01L5 6.5m0 0 1.19 5.66c.24 1.12.35 1.68.75 2.01.4.33.97.33 2.11.33h5.68c1.12 0 1.68 0 2.08-.32.4-.32.53-.87.78-1.96L18.6 8.9c.29-1.24.43-1.86.1-2.28-.34-.42-.98-.42-2.25-.42H5Z"
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={9} cy={19.5} r={1.7} stroke={color} strokeWidth={weight} />
    <Circle cx={16.5} cy={19.5} r={1.7} stroke={color} strokeWidth={weight} />
  </Svg>
);

export const ChartIcon = ({ size = 24, color = '#000' }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={3.4} y={13} width={4.2} height={7.6} rx={1.6} fill={color} />
    <Rect x={9.9} y={8.4} width={4.2} height={12.2} rx={1.6} fill={color} />
    <Rect x={16.4} y={3.6} width={4.2} height={17} rx={1.6} fill={color} />
  </Svg>
);

/** `solar:play-bold` — the 16x16 glyph inside available nodes. */
export const PlayIcon = ({ size = 24, color = '#000' }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8.53 3.6c-1.2-.72-2.53.2-2.53 1.5v13.8c0 1.3 1.33 2.22 2.53 1.5l11.1-6.66c1.16-.7 1.16-2.58 0-3.28L8.53 3.6Z"
      fill={color}
    />
  </Svg>
);

/** `Interface / Check` — the 24x24 glyph inside completed nodes. */
export const CheckIcon = ({ size = 24, color = '#000', weight = 2.6 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Path
      d="M4.5 12.6 9.4 17.5 19.5 7"
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** Marks the lesson you're on. */

export const KeyholeIcon = ({ size = 24, color = '#000' }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={10} r={3.6} fill={color} />
    <Path d="M10.4 12.6h3.2l1.5 6.2a1 1 0 0 1-.97 1.2H9.87a1 1 0 0 1-.97-1.2l1.5-6.2Z" fill={color} />
  </Svg>
);

/** The 6x11 "Vector" inside every "+25 XP" pill. */
export const BoltIcon = ({ size = 24, color = '#000' }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M13.9 1.5 4.2 13.6c-.4.5-.05 1.24.59 1.24h5.02l-1.7 8.06c-.14.66.7 1.05 1.11.52l9.7-12.1c.4-.5.05-1.25-.59-1.25h-5.02l1.7-8.05c.14-.66-.7-1.05-1.11-.52Z" fill={color} />
  </Svg>
);

/**
 * Chip icons.
 *
 * "Frame 2147236480" carries 20x20 rendered 3D icons
 * ("freepik_..._Photoroom") as raster fills, which could not be exported.
 * These are flat redraws of the same four objects in the screen's own blue and
 * slate, which sits better beside the rest of the UI than saturated emoji would.
 */

const ICON_BLUE = '#4E88AE';
const ICON_DEEP = '#2E5670';
const ICON_LIGHT = '#BCD8EA';

export const DumbbellIcon = ({ size = 24 }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={8.4} y={10.7} width={7.2} height={2.6} rx={1.1} fill={ICON_DEEP} />
    <Rect x={4.6} y={7.6} width={3.6} height={8.8} rx={1.5} fill={ICON_BLUE} />
    <Rect x={15.8} y={7.6} width={3.6} height={8.8} rx={1.5} fill={ICON_BLUE} />
    <Rect x={2.1} y={9.6} width={2.4} height={4.8} rx={1.1} fill={ICON_DEEP} />
    <Rect x={19.5} y={9.6} width={2.4} height={4.8} rx={1.1} fill={ICON_DEEP} />
  </Svg>
);

export const BottleIcon = ({ size = 24 }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={9.7} y={1.9} width={4.6} height={3.2} rx={1.1} fill={ICON_DEEP} />
    <Path
      d="M9.1 6.4h5.8c1.9 0 3.4 1.5 3.4 3.4v8.8c0 1.9-1.5 3.4-3.4 3.4H9.1a3.4 3.4 0 0 1-3.4-3.4V9.8c0-1.9 1.5-3.4 3.4-3.4Z"
      fill={ICON_BLUE}
    />
    <Rect x={7.8} y={10.6} width={8.4} height={4.6} rx={1.2} fill={ICON_LIGHT} />
  </Svg>
);

export const CombIcon = ({ size = 24 }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* One rotation for the whole comb, so spine and teeth stay aligned. */}
    <G transform="rotate(-22 12 12)">
      <Rect x={2.6} y={7} width={18.8} height={3.8} rx={1.9} fill={ICON_DEEP} />
      <Rect x={5} y={10.2} width={1.9} height={5.2} rx={0.95} fill={ICON_BLUE} />
      <Rect x={9} y={10.2} width={1.9} height={5.2} rx={0.95} fill={ICON_BLUE} />
      <Rect x={13} y={10.2} width={1.9} height={5.2} rx={0.95} fill={ICON_BLUE} />
      <Rect x={17} y={10.2} width={1.9} height={5.2} rx={0.95} fill={ICON_BLUE} />
    </G>
  </Svg>
);

export const ToothIcon = ({ size = 24 }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7.4 2.6c1.5 0 2.3.8 4.6.8s3.1-.8 4.6-.8c2.4 0 4 1.9 4 4.7 0 2.6-.9 4.2-1.5 6.5-.5 1.9-.6 4.1-1.2 5.8-.4 1.2-1 2-1.9 2-1.2 0-1.6-1.3-1.9-3-.3-1.6-.5-3.3-2.1-3.3s-1.8 1.7-2.1 3.3c-.3 1.7-.7 3-1.9 3-.9 0-1.5-.8-1.9-2-.6-1.7-.7-3.9-1.2-5.8C4.3 11.5 3.4 9.9 3.4 7.3c0-2.8 1.6-4.7 4-4.7Z"
      fill={ICON_BLUE}
    />
    <Path
      d="M7.6 5.1c1 0 1.7.4 3 .4"
      stroke="#FFFFFF"
      strokeWidth={1.7}
      strokeLinecap="round"
      opacity={0.75}
    />
  </Svg>
);

export const CHIP_ICONS = {
  fitness: DumbbellIcon,
  skincare: BottleIcon,
  hair: CombIcon,
  oral: ToothIcon,
} as const;

export type GlyphName = keyof typeof CHIP_ICONS;
