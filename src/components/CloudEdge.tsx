import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  interpolateColor,
  useAnimatedProps,
  useDerivedValue,
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
 * are whole circles of deliberately unequal size, sitting on the panel's top
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
 * Every lobe is animated by rebuilding its own path each frame from an animated
 * centre and radius. An earlier version wrapped each lobe in an animated <G>
 * and drove `scale`/`translate` on that instead: it animated correctly in a
 * browser and did nothing at all on device, leaving only the flat skirt
 * visible. Path data is the one thing every renderer agrees on. Rotation went
 * with it and was no loss — rotating a circle about its own centre is a no-op.
 */

/**
 * cx and r as fractions of the panel width. One dominant lobe with smaller ones
 * around it — even sizes are what make a cloud look manufactured. The outermost
 * centres sit past the edges so the corners stay covered.
 *
 * `rise`/`sway` are the idle travel in points, `period` its loop length, and
 * `lag` how far the lobe trails the panel while the panel is being dragged.
 */
const LOBES = [
  { cx: -0.02, r: 0.115, rise: 14, sway: 9, period: 7300, lag: 0.1 },
  { cx: 0.15, r: 0.135, rise: 18, sway: 11, period: 9400, lag: 0.14 },
  { cx: 0.38, r: 0.19, rise: 22, sway: 8, period: 11200, lag: 0.2 },
  { cx: 0.6, r: 0.13, rise: 16, sway: 11, period: 8200, lag: 0.13 },
  { cx: 0.79, r: 0.155, rise: 20, sway: 9, period: 10100, lag: 0.17 },
  { cx: 0.98, r: 0.125, rise: 14, sway: 8, period: 8700, lag: 0.11 },
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

/**
 * A circle as two half-arcs, always swept the same way so that subpaths union
 * rather than cancel. Runs on the UI thread, once per lobe per frame.
 */
function circlePath(x: number, y: number, r: number) {
  'worklet';
  return (
    `M ${x - r} ${y} a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 ${-r * 2} 0 Z`
  );
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
  const canvas = width + BLEED * 2;
  const inset = Math.max(4, width * 0.012);

  // Just deep enough to seal against the panel body. Any deeper and its top
  // edge shows as a flat white band above the lobes while they inflate.
  const skirt = `M 0 ${height - 14} H ${canvas} V ${height} H 0 Z`;

  const skirtProps = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [from, to]),
  }));

  return (
    <View style={[styles.clip, { height }]} pointerEvents="none">
      <View style={[styles.canvas, { left: -BLEED }]}>
        <Svg width={canvas} height={height}>
          <AnimatedPath d={skirt} animatedProps={skirtProps} />
          {LOBES.map((lobe, i) => (
            <Lobe
              key={i}
              lobe={lobe}
              index={i}
              x={BLEED + lobe.cx * width}
              baseY={height}
              radius={lobe.r * width}
              inset={inset}
              progress={progress}
              from={from}
              to={to}
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

/**
 * One puff: its fill, then its own arc directly on top. Keeping the pair
 * adjacent means the next lobe's fill still paints over this arc, which is what
 * leaves only the short curve in the valley.
 */
function Lobe({
  lobe,
  index,
  x,
  baseY,
  radius,
  inset,
  progress,
  from,
  to,
  open,
  drag,
  ripple,
}: {
  lobe: (typeof LOBES)[number];
  index: number;
  x: number;
  baseY: number;
  radius: number;
  inset: number;
  progress: SharedValue<number>;
  from: string;
  to: string;
  open?: SharedValue<number>;
  drag?: SharedValue<number>;
  ripple?: SharedValue<number>;
}) {
  const idle = useSharedValue(0);

  /** Staggers the unfolding left to right. */
  const formPhase = index * 0.07;
  /** Distance from the button below, so the press wave travels outward. */
  const ripplePhase = 0.1 + Math.abs(lobe.cx - 0.5) * 0.75;

  React.useEffect(() => {
    idle.value = withRepeat(
      withTiming(1, { duration: lobe.period, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [idle, lobe.period]);

  /**
   * Where this lobe's circle is, right now.
   *
   * Every shared value is read directly in this body, deliberately. Reanimated
   * works out what to subscribe to by looking at the hook's own source; move
   * these reads into a helper it cannot see into and it subscribes to nothing,
   * so the props evaluate once and then sit frozen forever.
   */
  const geometry = useDerivedValue(() => {
    // Unfold: each lobe waits its turn, then inflates into place. It starts at
    // 0.45 rather than near zero, because the biggest lobes have to stay taller
    // than the skirt throughout or its straight edge is what you see.
    const o = open ? open.value : 1;
    const form = Math.min(1, Math.max(0, (o - formPhase) / (1 - formPhase)));

    // Idle drift, forever.
    const t = idle.value;
    const rise = (0.5 - t) * 2 * lobe.rise;
    const sway = (t - 0.5) * 2 * lobe.sway;

    // Trail the panel while it is dragged, so the bank stretches.
    const pulled = drag ? Math.min(90, Math.max(0, drag.value)) : 0;

    // A bell centred on this lobe's turn in the wave.
    const rp = ripple ? ripple.value : 0;
    const pop = rp > 0 && rp < 1 ? Math.exp(-Math.pow((rp - ripplePhase) / 0.17, 2)) : 0;

    return {
      cx: x + sway,
      cy: baseY + rise + (1 - form) * 18 - pulled * lobe.lag - pop * 11,
      r: radius * (0.45 + form * 0.55) * (1 + pop * 0.13),
    };
  });

  const fillProps = useAnimatedProps(() => ({
    d: circlePath(geometry.value.cx, geometry.value.cy, geometry.value.r),
    fill: interpolateColor(progress.value, [0, 1], [from, to]),
  }));

  const arcProps = useAnimatedProps(() => ({
    d: circlePath(
      geometry.value.cx,
      geometry.value.cy,
      Math.max(2, geometry.value.r - inset),
    ),
    stroke: interpolateColor(
      progress.value,
      [0, 1],
      [colors.cloudDepth, colors.cloudDepthSuccess],
    ),
  }));

  // Static resting shape underneath the animated props. If the animation ever
  // fails to apply on some platform, this is a still cloud rather than no cloud
  // — which is precisely what the previous version got wrong: it carried no `d`
  // of its own, so when its animation did nothing, neither did it.
  const restFill = circlePath(x, baseY, radius);
  const restArc = circlePath(x, baseY, Math.max(2, radius - inset));

  return (
    <>
      <AnimatedPath d={restFill} fill={from} animatedProps={fillProps} />
      <AnimatedPath
        d={restArc}
        fill="none"
        stroke={colors.cloudDepth}
        strokeWidth={4}
        strokeLinecap="round"
        animatedProps={arcProps}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Overlaps the body slightly, so lobe motion can never open a seam.
  clip: { marginBottom: -6 },
  canvas: { position: 'absolute', bottom: 0 },
});
