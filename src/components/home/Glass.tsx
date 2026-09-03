import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';

/**
 * The gem pill — the one piece of glass on the Home frame.
 *
 * The inspector for that layer is short, and every earlier attempt here added
 * things it does not contain:
 *
 *   Fill     FFFFFF at 10%
 *   Stroke   none
 *   Effects  Glass — Light -45 degrees at 80%, Refraction 32, Depth 95,
 *            Dispersion 50, Frost 67, Splay 48
 *   Radius   43, padding 10, gap 4
 *
 * **There is no rim layer.** The bright edge in the rendered frame is made by
 * the Glass effect itself — Depth and Splay are what light the perimeter — not
 * by a stroke. Figma's Glass is its take on Apple's Liquid Glass, so on iOS 26
 * the honest build is the real `UIGlassEffect` under that 10% white fill, and
 * nothing more. `expo-glass-effect` wraps it and Expo Go for SDK 57 ships it.
 *
 * Four passes went into this before that, and each added a substitute for the
 * edge the effect already draws: a heavy flat fill, a 1px rim, an inset shadow
 * (which renders a stray lobe at the corner on iOS), and five stacked
 * hairlines (a fuzzy halo). The fix was to stop drawing an edge.
 *
 * Off iOS 26 there is no native glass to make that edge, so the fallback keeps
 * a single hairline for a limit and leans on a heavy blur. It is not the same
 * effect and does not pretend to be.
 */

/** Resolved once: it cannot change while the app is running. */
const LIQUID = isLiquidGlassAvailable();

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** The sky's `BlurTargetView`, so the Android blur has something to read. */
  target?: React.RefObject<View | null>;
  /** Blur strength for the non-Liquid backdrop, 1-100. Figma's Frost is 67. */
  intensity?: number;
  radius: number;
};

export default function Glass({ children, style, target, intensity = 66, radius }: Props) {
  if (LIQUID) {
    return (
      <GlassView
        // 'regular' rather than 'clear': Frost 67 is a frosted plate, and
        // 'clear' is Apple's near-transparent variant for media overlays.
        glassEffectStyle="regular"
        // The screen is light whatever the system is set to, so the glass must
        // not flip to its dark variant underneath it.
        colorScheme="light"
        style={[styles.glass, { borderRadius: radius }, style]}
      >
        {/* The frame's whole fill: white at 10%, flat. */}
        <View style={[styles.fill, { borderRadius: radius }]} pointerEvents="none" />
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint="light"
      blurTarget={target}
      blurMethod="dimezisBlurViewSdk31Plus"
      style={[styles.glass, { borderRadius: radius }, style]}
    >
      {/*
        The fill is a child rather than the blur's `backgroundColor`: every tint
        lays its own translucent colour over the blur and that wins over the
        style's background, so the plate came out the colour of the sky.
      */}
      <View style={[styles.fill, styles.fillFallback, { borderRadius: radius }]} pointerEvents="none" />
      {/* Standing in for the edge the native effect would have drawn. */}
      <View style={[styles.hairline, { borderRadius: radius }]} pointerEvents="none" />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: {
    // Clips the backdrop to the corner radius; without it Android squares it.
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.glassFill,
  },
  // A blur alone is far weaker than Liquid Glass, so the fallback carries more
  // white than the frame's 10% to read as a plate at all.
  fillFallback: { backgroundColor: colors.glassFillFallback },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: colors.glassEdge,
  },
});
