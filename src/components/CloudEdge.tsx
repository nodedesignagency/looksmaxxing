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
import Svg, { G, Path } from 'react-native-svg';
import { colors } from '../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

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
 * Every lobe then rises, falls and slides on its own loop, at its own period.
 * Moving the edge as one rigid piece is barely legible as motion; moving the
 * lobes against each other is what actually reads as billowing, because the
 * valleys between them deepen and fill as they go. Each lobe keeps its own
 * fill-then-arc pair inside its group, so the interleaved draw order — and with
 * it the depth — survives the animation.
 */

/**
 * cx and r as fractions of the panel width. One dominant lobe with smaller ones
 * around it — even sizes are what make a cloud look manufactured. The outermost
 * centres sit past the edges so the corners stay covered.
 */
const LOBES = [
  { cx: -0.02, r: 0.115, rise: 7, sway: 5, period: 5200 },
  { cx: 0.15, r: 0.135, rise: 9, sway: 6, period: 6900 },
  { cx: 0.38, r: 0.19, rise: 11, sway: 4, period: 8300 },
  { cx: 0.6, r: 0.13, rise: 8, sway: 6, period: 5900 },
  { cx: 0.79, r: 0.155, rise: 10, sway: 5, period: 7400 },
  { cx: 0.98, r: 0.125, rise: 7, sway: 4, period: 6300 },
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

function buildPaths(width: number, height: number) {
  const canvas = width + BLEED * 2;
  const inset = Math.max(4, width * 0.012);
  // Deep enough that a lobe sinking to the bottom of its travel cannot lift the
  // base off the panel body.
  const skirt = `M 0 ${(height - 16).toFixed(2)} H ${canvas.toFixed(2)} V ${height.toFixed(
    2,
  )} H 0 Z`;

  const lobes = LOBES.map(({ cx, r, rise, sway, period }) => {
    const rad = r * width;
    return {
      fill: circle(BLEED + cx * width, height, rad),
      arc: circle(BLEED + cx * width, height, Math.max(2, rad - inset)),
      rise,
      sway,
      period,
    };
  });

  return { canvas, skirt, lobes };
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
  const { canvas, skirt, lobes } = React.useMemo(
    () => buildPaths(width, height),
    [width, height],
  );

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

  // A slow drift of the whole bank, on top of the per-lobe motion. This one is
  // a plain view transform, so it holds even if animating an SVG group's
  // translate behaves differently on a given platform.
  const drift = useSharedValue(0);
  React.useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift]);
  const driftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (drift.value - 0.5) * 10 }],
  }));

  return (
    <View style={[styles.clip, { height }]} pointerEvents="none">
      <Animated.View style={[styles.canvas, { left: -BLEED }, driftStyle]}>
        <Svg width={canvas} height={height}>
          <AnimatedPath d={skirt} animatedProps={fillProps} />
          {lobes.map((lobe, i) => (
            <Lobe
              key={i}
              lobe={lobe}
              fillProps={fillProps}
              arcProps={arcProps}
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

type LobeShape = ReturnType<typeof buildPaths>['lobes'][number];

/**
 * One puff: its fill, then its own arc directly on top. Keeping the pair inside
 * a single group means the next lobe's fill still paints over this arc, which
 * is what leaves only the short curve in the valley.
 */
function Lobe({
  lobe,
  fillProps,
  arcProps,
}: {
  lobe: LobeShape;
  fillProps: ReturnType<typeof useAnimatedProps>;
  arcProps: ReturnType<typeof useAnimatedProps>;
}) {
  const t = useSharedValue(0);

  React.useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: lobe.period, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [t, lobe.period]);

  const motion = useAnimatedProps(() => ({
    translateX: (t.value - 0.5) * 2 * lobe.sway,
    translateY: (0.5 - t.value) * 2 * lobe.rise,
  }));

  return (
    <AnimatedG animatedProps={motion}>
      <AnimatedPath d={lobe.fill} animatedProps={fillProps} />
      <AnimatedPath
        d={lobe.arc}
        fill="none"
        strokeWidth={4}
        strokeLinecap="round"
        animatedProps={arcProps}
      />
    </AnimatedG>
  );
}

const styles = StyleSheet.create({
  // Overlaps the body slightly, so lobe motion can never open a seam.
  clip: { marginBottom: -6 },
  canvas: { position: 'absolute', bottom: 0 },
});
