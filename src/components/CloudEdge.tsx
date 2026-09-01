import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolateColor,
  useAnimatedProps,
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
 * line and overlapping their neighbours heavily. The valleys are the shallow
 * arcs where two circles cross.
 *
 * Depth comes from drawing every circle a second time as a stroke, inset from
 * its own edge, with fills and strokes interleaved lobe by lobe. Each lobe's
 * fill paints over the arc of the lobe before it, so what survives is a short
 * curve in the valley where the two meet — the way one puff reads as sitting in
 * front of another. Insetting means an arc can never stray outside the
 * silhouette, so nothing needs clipping.
 *
 * Each lobe carries four motions at once:
 *   - it inflates and tumbles into place as the panel opens, staggered, so the
 *     cloud assembles itself at the moment the eye is already on it;
 *   - it drifts on its own long loop forever after;
 *   - it lags behind the panel while the panel is dragged, so the bank stretches
 *     rather than travelling as one rigid slab;
 *   - it pops as a wave running outward from the button when the button is hit.
 */

/**
 * cx and r as fractions of the panel width. One dominant lobe with smaller ones
 * around it — even sizes are what make a cloud look manufactured. The outermost
 * centres sit past the edges so the corners stay covered.
 *
 * `rise`/`sway` are the idle travel in points, `period` its loop length, `lag`
 * how far the lobe trails the panel under a drag, and `tumble` the tilt it
 * unfolds from.
 */
const LOBES = [
  { cx: -0.02, r: 0.115, rise: 14, sway: 9, period: 7300, lag: 0.1, tumble: -14 },
  { cx: 0.15, r: 0.135, rise: 18, sway: 11, period: 9400, lag: 0.14, tumble: -9 },
  { cx: 0.38, r: 0.19, rise: 22, sway: 8, period: 11200, lag: 0.2, tumble: 6 },
  { cx: 0.6, r: 0.13, rise: 16, sway: 11, period: 8200, lag: 0.13, tumble: -6 },
  { cx: 0.79, r: 0.155, rise: 20, sway: 9, period: 10100, lag: 0.17, tumble: 10 },
  { cx: 0.98, r: 0.125, rise: 14, sway: 8, period: 8700, lag: 0.11, tumble: 15 },
];

const MAX_R = Math.max(...LOBES.map((l) => l.r));

/** Bleed each side, so drift never exposes the panel's corners. */
const BLEED = 16;

/** Room above the resting silhouette for a lobe at the top of its travel. */
const HEADROOM = 36;

/** Tall enough for the biggest lobe, plus its rise. */
export function cloudEdgeHeight(width: number) {
  return Math.round(MAX_R * width) + HEADROOM;
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
  // Just deep enough to seal against the panel body. Any deeper and its top
  // edge shows as a flat white band above the lobes while they are still
  // inflating.
  const skirt = `M 0 ${(height - 14).toFixed(2)} H ${canvas.toFixed(2)} V ${height.toFixed(
    2,
  )} H 0 Z`;

  const lobes = LOBES.map((lobe, i) => {
    const x = BLEED + lobe.cx * width;
    const rad = lobe.r * width;
    return {
      ...lobe,
      x,
      fill: circle(x, height, rad),
      arc: circle(x, height, Math.max(2, rad - inset)),
      /** Staggers the unfolding left to right. */
      formPhase: i * 0.07,
      /** Distance from the button below, so the press wave travels outward. */
      ripplePhase: 0.1 + Math.abs(lobe.cx - 0.5) * 0.75,
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
  /** 0-1 as the panel opens; drives the cloud assembling itself. */
  open?: SharedValue<number>;
  /** How far the panel has been dragged down, in points. */
  drag?: SharedValue<number>;
  /** 0-1 one-shot; a pop travelling outward from the button. */
  ripple?: SharedValue<number>;
};

export default function CloudEdge({ width, progress, from, to, open, drag, ripple }: Props) {
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

  return (
    <View style={[styles.clip, { height }]} pointerEvents="none">
      <View style={[styles.canvas, { left: -BLEED }]}>
        <Svg width={canvas} height={height}>
          <AnimatedPath d={skirt} animatedProps={fillProps} />
          {lobes.map((lobe, i) => (
            <Lobe
              key={i}
              lobe={lobe}
              baseY={height}
              fillProps={fillProps}
              arcProps={arcProps}
              open={open}
              drag={drag}
              ripple={ripple}
            />
          ))}
        </Svg>
      </View>
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
  baseY,
  fillProps,
  arcProps,
  open,
  drag,
  ripple,
}: {
  lobe: LobeShape;
  baseY: number;
  fillProps: ReturnType<typeof useAnimatedProps>;
  arcProps: ReturnType<typeof useAnimatedProps>;
  open?: SharedValue<number>;
  drag?: SharedValue<number>;
  ripple?: SharedValue<number>;
}) {
  const idle = useSharedValue(0);

  React.useEffect(() => {
    idle.value = withRepeat(
      withTiming(1, { duration: lobe.period, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [idle, lobe.period]);

  const motion = useAnimatedProps(() => {
    // Unfold: each lobe waits its turn, then inflates and straightens up.
    const o = open ? open.value : 1;
    const span = 1 - lobe.formPhase;
    const form = Math.min(1, Math.max(0, (o - lobe.formPhase) / span));

    // Idle drift, forever.
    const t = idle.value;
    const rise = (0.5 - t) * 2 * lobe.rise;
    const sway = (t - 0.5) * 2 * lobe.sway;

    // Trail the panel while it is being dragged, so the bank stretches.
    const pulled = drag ? Math.min(90, Math.max(0, drag.value)) : 0;

    // A bell centred on this lobe's turn in the wave.
    const r = ripple ? ripple.value : 0;
    const pop = r > 0 && r < 1 ? Math.exp(-Math.pow((r - lobe.ripplePhase) / 0.17, 2)) : 0;

    // Starts at 0.45 rather than near zero: the biggest lobes have to stay
    // taller than the skirt through the whole unfold, or its straight top edge
    // is what you see instead of a cloud.
    return {
      scale: (0.45 + form * 0.55) * (1 + pop * 0.13),
      rotation: (1 - form) * lobe.tumble,
      translateX: sway,
      translateY: rise + (1 - form) * 18 - pulled * lobe.lag - pop * 11,
    };
  });

  return (
    <AnimatedG originX={lobe.x} originY={baseY} animatedProps={motion}>
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
