import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';

/**
 * The gem pill — the one piece of real glass on the Home frame.
 *
 * Figma puts its Glass material on that layer and nothing else: Frost 67,
 * Light -45 degrees at 80%, Refraction 32, Depth 95, Dispersion 50, Splay 48.
 * Refraction and dispersion bend and split what is behind the plate, and
 * nothing in React Native does that. Frost and the light do carry over, and
 * between them they are most of what the effect looks like.
 *
 * So the plate is a heavy blur, a very thin face, and — the part that actually
 * carries it — a soft luminous edge.
 *
 * That edge is an **inset box shadow**, not a border. Depth 95 and Splay 48
 * give the frame's pill a wide glowing band around its perimeter that fades
 * inward; a 1px rim draws a hard outline instead, and stacking a second ring
 * inside it only reads as a double outline. `boxShadow` with `inset` is in
 * React Native from 0.76 and does the real thing: one shadow all round for the
 * band, and a second offset down-right so the top-left inner edge lights up,
 * which is where Light at -45 degrees puts it.
 *
 * The face stays thin on purpose. Glass is mostly the thing behind it — in the
 * frame you read the cloud straight through the pill — so weighting the fill is
 * what made two earlier passes milky and opaque.
 *
 * Three mechanics are load-bearing:
 *
 * - **The face is a child, not the blur's `backgroundColor`.** Every tint lays
 *   its own translucent colour over the blur and that wins over the style's
 *   background, so the plate came out the colour of the sky. A child paints
 *   after both.
 * - **The rim is an inset border**, not the view's own, so the stroke cannot be
 *   clipped by the blur's rounding on either platform.
 * - **The sky is a `BlurTargetView`.** SDK 57's Android blur reads from one
 *   rather than from whatever happens to be behind the view, so its ref comes
 *   down here as `target`. Without it Android falls back to the face alone.
 */

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** The sky's `BlurTargetView`, so Android has something to blur. */
  target?: React.RefObject<View | null>;
  /** 1-100. Figma's Frost reads 67. */
  intensity?: number;
  radius: number;
};

export default function Glass({ children, style, target, intensity = 66, radius }: Props) {
  return (
    <BlurView
      intensity={intensity}
      tint="light"
      blurTarget={target}
      blurMethod="dimezisBlurViewSdk31Plus"
      style={[styles.glass, { borderRadius: radius }, style]}
    >
      {/* Light at -45 degrees: the bright corner is the top-left one. */}
      <LinearGradient
        colors={[colors.glassLit, colors.glassShade]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.face, { borderRadius: radius }]}
        pointerEvents="none"
      />
      {/* The edge: a wide inner glow, plus a hairline so it still has a limit. */}
      <View style={[styles.edge, { borderRadius: radius }]} pointerEvents="none" />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: {
    // Clips the blur to the corner radius; without it Android paints it square.
    overflow: 'hidden',
  },
  face: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  edge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: colors.glassEdge,
    // Written as a string rather than the array form: react-native-web takes
    // CSS here, and both targets accept it.
    boxShadow:
      'inset 0 0 10px rgba(255,255,255,0.7), inset 2px 2px 8px rgba(255,255,255,0.65)',
  },
});
