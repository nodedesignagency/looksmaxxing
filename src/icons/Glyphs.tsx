import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

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

export const ChartIcon = ({ size = 24, color = '#000', weight = 1.6 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Path
      d="M5 20V13.5M12 20V4M19 20v-9.5"
      stroke={color}
      strokeWidth={weight * 1.35}
      strokeLinecap="round"
    />
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
export const StarIcon = ({ size = 24, color = '#000' }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.79 3.1c.5-1.02 1.92-1.02 2.42 0l2.05 4.18c.2.4.58.68 1.02.75l4.6.67c1.12.17 1.56 1.55.75 2.34l-3.33 3.26c-.32.31-.46.76-.39 1.2l.79 4.6c.19 1.12-.98 1.97-1.98 1.44l-4.11-2.17a1.35 1.35 0 0 0-1.26 0L7.24 21.5c-1 .53-2.17-.32-1.98-1.43l.79-4.6c.07-.45-.08-.9-.39-1.21L2.33 11c-.81-.79-.37-2.17.76-2.34l4.6-.67c.44-.07.82-.35 1.02-.75L10.79 3.1Z"
      fill={color}
    />
  </Svg>
);

export const LockIcon = ({ size = 24, color = '#000', weight = 1.7 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Rect
      x={3.6}
      y={10.2}
      width={16.8}
      height={11.3}
      rx={4}
      stroke={color}
      strokeWidth={weight}
    />
    <Path
      d="M7.4 10.2V7.6a4.6 4.6 0 1 1 9.2 0v2.6"
      stroke={color}
      strokeWidth={weight}
      strokeLinecap="round"
    />
    <Circle cx={12} cy={15.8} r={1.5} fill={color} />
  </Svg>
);

/** The 6x11 "Vector" inside every "+25 XP" pill. */
export const BoltIcon = ({ size = 24, color = '#000' }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M13.9 1.5 4.2 13.6c-.4.5-.05 1.24.59 1.24h5.02l-1.7 8.06c-.14.66.7 1.05 1.11.52l9.7-12.1c.4-.5.05-1.25-.59-1.25h-5.02l1.7-8.05c.14-.66-.7-1.05-1.11-.52Z" fill={color} />
  </Svg>
);

export const CloseIcon = ({ size = 24, color = '#000', weight = 2 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" stroke={color} strokeWidth={weight} strokeLinecap="round" />
  </Svg>
);

export const FireIcon = ({ size = 24, color = '#000' }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.2c.4 3.1-1.3 4.6-2.9 6C7.4 9.7 6 11 6 13.9A6 6 0 0 0 18 14c0-3.3-1.6-5.3-3.1-6.7-.6 1-1.3 1.5-2 1.7.5-2.6-.2-5.1-.9-6.8Z"
      fill={color}
    />
  </Svg>
);

// --- Category chip glyphs -------------------------------------------------
// The Figma chips use 20x20 raster images (`freepik_..._Photoroom`) that could
// not be exported; these Solar-style stand-ins keep the chip geometry intact.

export const DumbbellIcon = ({ size = 24, color = '#000', weight = 1.6 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Path d="M6.5 9v6M4 10.2v3.6M17.5 9v6M20 10.2v3.6M8.5 12h7" stroke={color} strokeWidth={weight} strokeLinecap="round" />
  </Svg>
);

export const DropletIcon = ({ size = 24, color = '#000', weight = 1.6 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Path
      d="M12 2.8c2.6 3 6.2 6.3 6.2 10.1a6.2 6.2 0 1 1-12.4 0C5.8 9.1 9.4 5.8 12 2.8Z"
      stroke={color}
      strokeWidth={weight}
      strokeLinejoin="round"
    />
  </Svg>
);

export const ScissorsIcon = ({ size = 24, color = '#000', weight = 1.6 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Path d="M7.6 8.4 18 19M18 5 9.4 13.6" stroke={color} strokeWidth={weight} strokeLinecap="round" />
    <Circle cx={6.2} cy={6.2} r={2.4} stroke={color} strokeWidth={weight} />
    <Circle cx={6.2} cy={17.8} r={2.4} stroke={color} strokeWidth={weight} />
  </Svg>
);

export const SmileIcon = ({ size = 24, color = '#000', weight = 1.6 }: GlyphProps) => (
  <Svg {...linear(size)}>
    <Circle cx={12} cy={12} r={9.2} stroke={color} strokeWidth={weight} />
    <Path d="M8.4 14.2c.9 1.2 2.1 1.8 3.6 1.8s2.7-.6 3.6-1.8" stroke={color} strokeWidth={weight} strokeLinecap="round" />
    <Path d="M9 9.3v.9M15 9.3v.9" stroke={color} strokeWidth={weight * 1.2} strokeLinecap="round" />
  </Svg>
);

export const GLYPHS = {
  dumbbell: DumbbellIcon,
  droplet: DropletIcon,
  scissors: ScissorsIcon,
  smile: SmileIcon,
} as const;

export type GlyphName = keyof typeof GLYPHS;
