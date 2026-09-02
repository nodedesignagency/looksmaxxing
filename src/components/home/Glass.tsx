import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';

/**
 * The frosted plates the Home frame is built from: the streak card, the gem
 * pill and the quest counter.
 *
 * Real blur, not a translucent fill. The frame's cards let the cloud behind
 * them through softened rather than tinted, and a flat white at 40% cannot do
 * that — over a cloud edge it reads as a grey wash, which is what the first
 * pass looked like.
 *
 * Two things carry the effect besides the blur. A hairline stroke, brighter
 * than the fill, which is what gives a glass edge its lit rim; and a fill laid
 * over the blur rather than instead of it, because blur alone takes the sky's
 * colour and the card stops separating from it.
 *
 * On Android the blur needs somewhere to read from — SDK 57 blurs the content
 * of a `BlurTargetView` rather than whatever happens to be behind — so the sky
 * is one, and its ref comes down to every plate as `target`. Without it Android
 * falls back to the semi-transparent fill, which is the old look and still fine.
 */

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** The sky's `BlurTargetView`, so Android has something to blur. */
  target?: React.RefObject<View | null>;
  /** 1-100. The frame's plates are soft rather than heavy. */
  intensity?: number;
  radius: number;
};

export default function Glass({ children, style, target, intensity = 42, radius }: Props) {
  return (
    <BlurView
      intensity={intensity}
      tint="light"
      blurTarget={target}
      blurMethod="dimezisBlurViewSdk31Plus"
      style={[styles.glass, { borderRadius: radius }, style]}
    >
      {/*
        The fill is a layer of its own rather than the blur's `backgroundColor`.
        Every tint lays its own translucent colour over the blur, and on the web
        target that wins over the style's background — so the plate came out the
        colour of the sky instead of frosted. A child paints after both.
      */}
      <View style={[styles.fill, { borderRadius: radius }]} pointerEvents="none" />
      {/* The rim. An inset border rather than the view's own, so the stroke
          cannot be clipped by the blur's rounding on either platform. */}
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
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.glassFill,
  },
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
