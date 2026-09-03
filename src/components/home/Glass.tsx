import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';

/**
 * The gem pill — the one piece of glass on the Home frame.
 *
 * Figma puts its Glass material on that layer and nothing else: Frost 67,
 * Light -45 degrees at 80%, Refraction 32, Depth 95, Dispersion 50, Splay 48.
 * That material is Figma's take on Apple's Liquid Glass, and on a device that
 * has Liquid Glass the right answer is not to approximate it — it is to ask for
 * it. `expo-glass-effect` wraps `UIGlassEffect`, Expo Go for SDK 57 ships it
 * natively, and it is the same effect the design is modelled on, so it lands
 * refraction and dispersion that nothing drawn by hand can.
 *
 * Three passes were spent hand-rolling this before that: a flat fill (milky), a
 * thinner fill with a hard rim (a drawn outline), and an inset box shadow (which
 * renders a stray lobe at the corner on iOS). All of them were approximating an
 * effect the platform already has.
 *
 * Everywhere else — Android, the web build, iOS before 26 — falls back to a
 * blur under a thin lit face and an inset glow. Not the same thing, but the same
 * read: mostly what is behind it, with a luminous edge.
 */

/** Resolved once: it cannot change while the app is running. */
const LIQUID = isLiquidGlassAvailable();

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** The sky's `BlurTargetView`, so the Android fallback has something to blur. */
  target?: React.RefObject<View | null>;
  /** Fallback blur strength, 1-100. Figma's Frost reads 67. */
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
        style={[{ borderRadius: radius }, style]}
      >
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
        The face is a child rather than the blur's `backgroundColor`: every tint
        lays its own translucent colour over the blur and that wins over the
        style's background, so the plate came out the colour of the sky.
      */}
      <LinearGradient
        colors={[colors.glassLit, colors.glassShade]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.face, { borderRadius: radius }]}
        pointerEvents="none"
      />
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
    // A string, not the array form: react-native-web takes CSS here and both
    // targets accept it.
    boxShadow:
      'inset 0 0 10px rgba(255,255,255,0.7), inset 2px 2px 8px rgba(255,255,255,0.65)',
  },
});
