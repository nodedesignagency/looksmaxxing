import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';

/**
 * The gem pill — the one piece of glass on the Home frame.
 *
 * Figma's Glass material on that layer reads Frost 67, Light -45 degrees at
 * 80%, Refraction 32, Depth 95, Dispersion 50, Splay 48. That material is
 * Figma's take on Apple's Liquid Glass, so on iOS 26 the backdrop is the real
 * `UIGlassEffect` by way of `expo-glass-effect`, which Expo Go for SDK 57 ships
 * natively. Everywhere else it is a heavy blur.
 *
 * **The backdrop is only the backdrop.** Both of them are nearly invisible on
 * their own over a pale sky — Liquid Glass is adaptive and deliberately subtle,
 * and it drew nothing at all here on device. What makes this read as a plate is
 * the skin painted over it, and that is drawn identically on every platform:
 * a lit face, then the edge.
 *
 * The edge is five concentric hairlines fading inward rather than one border or
 * an inset shadow. A single border draws a hard outline, which is not what
 * Depth 95 and Splay 48 give the frame; `boxShadow` with `inset` is the right
 * primitive and renders a stray lobe at the corner on iOS. Stacked rings are
 * plain Views, so they are pixel-identical on iOS, Android and web, and five of
 * them across five points is a soft glow.
 */

/** Resolved once: it cannot change while the app is running. */
const LIQUID = isLiquidGlassAvailable();

/** The edge, from the rim inward. Opacity falls off to nothing over 5pt. */
const RINGS = [0.85, 0.5, 0.3, 0.18, 0.09];

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
  const skin = (
    <>
      {/* Light at -45 degrees: the bright corner is the top-left one. */}
      <LinearGradient
        colors={[colors.glassLit, colors.glassShade]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.layer, { borderRadius: radius }]}
        pointerEvents="none"
      />
      {RINGS.map((opacity, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.layer,
            {
              top: i,
              left: i,
              right: i,
              bottom: i,
              borderRadius: Math.max(0, radius - i),
              borderWidth: 1,
              borderColor: `rgba(255,255,255,${opacity})`,
            },
          ]}
        />
      ))}
      {children}
    </>
  );

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
        {skin}
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
      {skin}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glass: {
    // Clips the backdrop to the corner radius; without it Android squares it.
    overflow: 'hidden',
  },
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});
