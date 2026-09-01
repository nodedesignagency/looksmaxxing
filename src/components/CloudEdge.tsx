import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The billowing top edge of the lesson panel.
 *
 * Not a row of tangent semicircles — those meet in a sharp cusp at every
 * valley, which is what makes an edge read as scalloped rather than soft. These
 * are whole circles of deliberately unequal size, centred on the panel's top
 * line and overlapping their neighbours heavily. Each is emitted as a subpath
 * of one path wound the same way, so the nonzero fill rule unions them and the
 * valleys come out as the shallow arcs where two circles cross.
 *
 * Depth comes from drawing every circle a second time as a stroke, inset from
 * its own edge, with fills and strokes interleaved lobe by lobe. Each lobe's
 * fill paints over the arc of the lobe before it, so what survives is a short
 * curve in the valley where the two meet — the way one puff reads as sitting in
 * front of another. Drawing every arc after every fill instead leaves whole
 * rings floating on the surface, which is what this looked like before.
 * Insetting means an arc can never stray outside the silhouette, so nothing
 * needs clipping.
 *
 * The whole edge then drifts and stretches on long, mismatched loops. Scaling
 * horizontally moves the lobes relative to each other, so the shape genuinely
 * billows instead of sliding about rigidly.
 */

/**
 * cx and r as fractions of the panel width. One dominant lobe with smaller ones
 * around it — even sizes are what make a cloud look manufactured. The outermost
 * centres sit past the edges so the corners stay covered.
 */
const LOBES = [
  { cx: -0.02, r: 0.115 },
  { cx: 0.15, r: 0.135 },
  { cx: 0.38, r: 0.19 },
  { cx: 0.6, r: 0.13 },
  { cx: 0.79, r: 0.155 },
  { cx: 0.98, r: 0.125 },
];

const MAX_R = Math.max(...LOBES.map((l) => l.r));

/** Bleed each side, so drift and stretch never expose the panel's corners. */
const BLEED = 16;

/** Tall enough for the biggest lobe to clear the panel's top line. */
export function cloudEdgeHeight(width: number) {
  return Math.round(MAX_R * width);
}

function circle(x: number, y: number, r: number) {
  // Two half-arcs, always swept the same way so subpaths union rather than cancel.
  return (
    `M ${(x - r).toFixed(2)} ${y.toFixed(2)}` +
    ` a ${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${(r * 2).toFixed(2)} 0` +
    ` a ${r.toFixed(2)} ${r.toFixed(2)} 0 1 1 ${(-r * 2).toFixed(2)} 0 Z`
  );
}

type Layer = { kind: 'fill' | 'arc'; d: string };

function buildPaths(width: number, height: number) {
  const canvas = width + BLEED * 2;
  const inset = Math.max(4, width * 0.012);

  // A sliver along the bottom first, so no antialiasing seam opens against the
  // body sitting directly beneath.
  const layers: Layer[] = [
    {
      kind: 'fill',
      d: `M 0 ${(height - 4).toFixed(2)} H ${canvas.toFixed(2)} V ${height.toFixed(2)} H 0 Z`,
    },
  ];

  for (const { cx, r } of LOBES) {
    const x = BLEED + cx * width;
    const rad = r * width;
    layers.push({ kind: 'fill', d: circle(x, height, rad) });
    layers.push({ kind: 'arc', d: circle(x, height, Math.max(2, rad - inset)) });
  }

  return { canvas, layers };
}

type Props = {
  width: number;
  /** 0-1, crossing the edge from `from` to `to` alongside the panel. */
  progress: SharedValue<number>;
  from: string;
  to: string;
};

export default function CloudEdge({ width, progress, from, to }: Props) {
  const height = cloudEdgeHeight(width);
  const { canvas, layers } = React.useMemo(
    () => buildPaths(width, height),
    [width, height],
  );

  // Three loops of different length, so the shape never repeats a pose exactly.
  const drift = useSharedValue(0);
  const swell = useSharedValue(0);
  const bob = useSharedValue(0);

  React.useEffect(() => {
    const loop = (v: SharedValue<number>, duration: number) =>
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
    drift.value = loop(drift, 9000);
    swell.value = loop(swell, 6500);
    bob.value = loop(bob, 4700);
  }, [drift, swell, bob]);

  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateX: (drift.value - 0.5) * 9 },
      { translateY: (bob.value - 0.5) * 4 },
      { scaleX: 1 + swell.value * 0.035 },
    ],
  }));

  const fillProps = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [from, to]),
  }));

  const arcProps = useAnimatedProps(() => ({
    stroke: interpolateColor(
      progress.value,
      [0, 1],
      [colors.cloudDepth, colors.cloudDepthSuccess],
    ),
  }));

  return (
    <View style={[styles.clip, { height }]} pointerEvents="none">
      <Animated.View style={[styles.canvas, { left: -BLEED }, motion]}>
        <Svg width={canvas} height={height}>
          {layers.map((layer, i) =>
            layer.kind === 'fill' ? (
              <AnimatedPath key={i} d={layer.d} animatedProps={fillProps} />
            ) : (
              <AnimatedPath
                key={i}
                d={layer.d}
                fill="none"
                strokeWidth={4}
                strokeLinecap="round"
                animatedProps={arcProps}
              />
            ),
          )}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Overlaps the body slightly, so the vertical bob can never open a seam.
  clip: { marginBottom: -4 },
  canvas: { position: 'absolute', bottom: 0 },
});
