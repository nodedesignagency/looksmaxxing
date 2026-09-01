import React from 'react';
import { Image, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import CheckSvg from '../../assets/icons/check.svg';
import HomeSvg from '../../assets/icons/home.svg';
import PathSvg from '../../assets/icons/path.svg';
import ProgressSvg from '../../assets/icons/progress.svg';

/**
 * Icons exported from the design file, plus the two the export did not cover.
 *
 * The four SVGs had their colours rewritten to `currentColor`, so a single
 * `color` prop on the root cascades and each one can be themed per state.
 *
 * Play and lock came out of Figma as a solid rect masked by an embedded raster.
 * Rather than lean on SVG masks and patterns — the least portable corner of the
 * spec — the raster is extracted to a PNG and tinted, which is the same
 * artwork with none of the risk.
 */

export type GlyphProps = {
  size?: number;
  color?: string;
  /** Stroke weight, for the hand-drawn glyphs only. */
  weight?: number;
};

export const CheckIcon = ({ size = 24, color = '#000' }: GlyphProps) => (
  <CheckSvg width={size} height={size} color={color} />
);

export const HomeAngleIcon = ({ size = 20, color = '#000' }: GlyphProps) => (
  <HomeSvg width={size} height={size} color={color} />
);

export const RouteIcon = ({ size = 20, color = '#000' }: GlyphProps) => (
  <PathSvg width={size} height={size} color={color} />
);

export const ChartIcon = ({ size = 20, color = '#000' }: GlyphProps) => (
  <ProgressSvg width={size} height={size} color={color} />
);

export const PlayIcon = ({ size = 16, color = '#588AAB' }: GlyphProps) => (
  <Image
    source={require('../../assets/icons/play.png')}
    style={[styles.glyph, { width: size, height: size }]}
    tintColor={color}
    resizeMode="contain"
  />
);

export const KeyholeIcon = ({ size = 16, color = '#588AAB' }: GlyphProps) => (
  <Image
    source={require('../../assets/icons/lock.png')}
    style={[styles.glyph, { width: size, height: size }]}
    tintColor={color}
    resizeMode="contain"
  />
);

/** No shop glyph came with the export; drawn on Solar's 24px grid to match. */
export const CartIcon = ({ size = 20, color = '#000', weight = 1.6 }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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

/** The 6x11 "Vector" inside every "+25 XP" pill. */
export const BoltIcon = ({ size = 12, color = '#10AB6E' }: GlyphProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13.9 1.5 4.2 13.6c-.4.5-.05 1.24.59 1.24h5.02l-1.7 8.06c-.14.66.7 1.05 1.11.52l9.7-12.1c.4-.5.05-1.25-.59-1.25h-5.02l1.7-8.05c.14-.66-.7-1.05-1.11-.52Z"
      fill={color}
    />
  </Svg>
);

/**
 * Chip icons, as rendered in the design file. Each is an 88px sprite with its
 * own alpha, so they are drawn as images rather than tinted.
 */
export const CHIP_IMAGES = {
  fitness: require('../../assets/chips/fitness.png'),
  skincare: require('../../assets/chips/skincare.png'),
  hair: require('../../assets/chips/hair.png'),
  oral: require('../../assets/chips/oral.png'),
} as const;

export type GlyphName = keyof typeof CHIP_IMAGES;

const styles = StyleSheet.create({
  glyph: { resizeMode: 'contain' },
});
