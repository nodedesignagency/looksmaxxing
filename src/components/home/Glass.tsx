import React from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';

/**
 * The gem pill — the one piece of glass on the Home frame.
 *
 * It draws nothing. Its inspector reads white at 10%, no stroke, and one
 * effect — Glass, with Light -45° at 80%, Refraction 32, Depth 95, Dispersion
 * 50, Frost 67, Splay 48 — and that effect is a lens over whatever is behind
 * the plate. Views cannot bend what is behind them, so the glass is painted by
 * the sky's own canvas, at this frame, by `glassShader.ts`. This is the frame:
 * it lays the gem and the count out, reports its size, and lets the sky show
 * through to the glass drawn underneath.
 *
 * Everything hand-built here before — blur under a fill under a rim, or
 * Apple's Liquid Glass — drew an outline, and an outline carries none of the
 * image behind it. None of them read as the frame does.
 */

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** The pill's corner radius, kept on the view so hit-testing and any
      clipping match the glass drawn beneath. */
  radius: number;
  /** The pill hugs its contents, so the sky learns its size from here. */
  onSize: (size: { w: number; h: number }) => void;
};

export default function Glass({ children, style, radius, onSize }: Props) {
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    onSize({ w: width, h: height });
  };

  return (
    <View style={[styles.frame, { borderRadius: radius }, style]} onLayout={onLayout}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { backgroundColor: 'transparent' },
});
