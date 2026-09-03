import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../../theme/tokens';

/**
 * The gem pill — the one piece of glass on the Home frame.
 *
 * Its inspector is short: fill FFFFFF at 10%, no stroke, and one effect —
 * Glass, with Light -45° at 80%, Refraction 32, Depth 95, Dispersion 50,
 * Frost 67, Splay 48. Everything you see on the rendered pill beyond the fill
 * is that effect, so each slider is built here as its own layer, bottom up:
 *
 *   Frost        the blur of what is behind the plate
 *   Fill         the frame's own 10% white
 *   Light        a wash from the top-left corner, the way -45° lights it
 *   Depth/Splay  a wide, soft band inside the rim — what the lens bends the
 *                sky into near the edge, which reads as the edge's glow
 *   Dispersion   a warm and a cool hairline just inside the rim
 *   Refraction   the rim: a thin bright line, strongest where it faces the
 *                light and again opposite, fading through the sides
 *
 * The rim is a gradient stroke, not a border, because a border is one colour
 * all the way round and a lit edge is not. Apple's Liquid Glass was tried in
 * place of all this; on a light sky it is far quieter than Figma's material
 * and the rim is the part that goes missing. This is the same build on every
 * platform, so it can be checked on any of them.
 *
 * The layers are absolute and the children lay out on top, so `style` carries
 * the pill's own padding and row layout as it always did.
 */

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** The sky's `BlurTargetView`, so the Android blur has something to read. */
  target?: React.RefObject<View | null>;
  /** Blur strength, 1-100. Figma's Frost is 67. */
  intensity?: number;
  radius: number;
};

/** How far in from the edge each ring sits, and how wide it is. */
const EDGE = { inset: 0.75, width: 1.5 };
const WARM = { inset: 2, width: 0.8 };
const COOL = { inset: 2.8, width: 0.8 };
const BAND = { inset: 2.5, width: 6 };

export default function Glass({ children, style, target, intensity = 67, radius }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  return (
    <View style={[styles.glass, { borderRadius: radius }, style]} onLayout={onLayout}>
      {/* Frost. The fill is a sibling rather than the blur's background: every
          tint lays its own colour over the blur and wins over the style's. */}
      <BlurView
        intensity={intensity}
        // 'default', not 'light': every tint lays its own white over the blur,
        // and 'light' lays half as much again as the plate's whole fill — which
        // is what turned the pill milky. 'default' is the thin one.
        tint="default"
        blurTarget={target}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={[StyleSheet.absoluteFill, styles.fill]} pointerEvents="none" />
      {/* Light, -45°: brightest at the top-left corner, gone by the middle. */}
      <LinearGradient
        colors={[colors.glassLight, 'rgba(255,255,255,0)']}
        locations={[0, 0.55]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {size.w > 0 && size.h > 0 ? (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <SvgGradient id="rim" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.glassEdge} />
              <Stop offset="0.4" stopColor={colors.glassEdgeMid} />
              <Stop offset="0.6" stopColor={colors.glassEdgeMid} />
              <Stop offset="1" stopColor={colors.glassEdgeFar} />
            </SvgGradient>
            <SvgGradient id="band" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.glassBand} />
              <Stop offset="0.38" stopColor={colors.glassBandMid} />
              <Stop offset="0.62" stopColor={colors.glassBandMid} />
              <Stop offset="1" stopColor={colors.glassBandFar} />
            </SvgGradient>
          </Defs>
          <Ring size={size} radius={radius} ring={BAND} stroke="url(#band)" />
          <Ring size={size} radius={radius} ring={COOL} stroke={colors.glassCool} />
          <Ring size={size} radius={radius} ring={WARM} stroke={colors.glassWarm} />
          <Ring size={size} radius={radius} ring={EDGE} stroke="url(#rim)" />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

/**
 * One rounded-rect stroke, inset so it never leaves the pill's silhouette.
 *
 * The corner radius is clamped to what the inset box can hold, the way the
 * frame's 43 already capsules a 41-tall pill — and so a ring's corners stay
 * concentric with the pill's rather than tightening as they move inward.
 */
function Ring({
  size,
  radius,
  ring,
  stroke,
}: {
  size: { w: number; h: number };
  radius: number;
  ring: { inset: number; width: number };
  stroke: string;
}) {
  const at = ring.inset + ring.width / 2;
  const w = size.w - at * 2;
  const h = size.h - at * 2;
  const r = Math.max(0, Math.min(radius - at, w / 2, h / 2));
  return (
    <Rect
      x={at}
      y={at}
      width={w}
      height={h}
      rx={r}
      ry={r}
      fill="none"
      stroke={stroke}
      strokeWidth={ring.width}
    />
  );
}

const styles = StyleSheet.create({
  glass: {
    // Clips the blur and the rings to the corner radius; without it Android
    // squares the backdrop off.
    overflow: 'hidden',
  },
  fill: { backgroundColor: colors.glassFill },
});
