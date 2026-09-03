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
 * So the plate is a heavy blur under a *lit* face rather than a flat wash:
 * bright in the top-left corner the light comes from, falling away to the
 * opposite one, with a brighter rim around it. A flat fill is what the first
 * pass had, and next to the real thing it reads as a sticker.
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
      <View style={[styles.rim, { borderRadius: radius }]} pointerEvents="none" />
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
  rim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: colors.glassEdge,
  },
});
