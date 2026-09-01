import React from 'react';
import Animated, {
  SharedValue,
  interpolateColor,
  useAnimatedProps,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The bumpy top edge of the lesson panel — the same trick Duolingo uses to make
 * its result card read as a bank of foliage, except here the motif is cloud,
 * which is what the screen is already full of.
 *
 * Each bump is a semicircle sitting on the panel's top line, so bump height is
 * always half its width: vary the widths and the silhouette varies with them,
 * with no seams to line up.
 */

/** Relative bump widths, deliberately uneven so the edge never looks stamped. */
const BUMPS = [1.0, 1.55, 1.15, 1.75, 0.92, 1.4, 1.08, 1.6, 0.95];
const TOTAL = BUMPS.reduce((a, b) => a + b, 0);

/** Height the edge needs: the tallest bump's radius, plus a hair of headroom. */
export function cloudEdgeHeight(width: number) {
  return (Math.max(...BUMPS) / TOTAL) * width * 0.5 + 1;
}

function cloudPath(width: number, height: number) {
  let x = 0;
  let d = `M 0 ${height.toFixed(2)}`;
  for (const w of BUMPS) {
    const bw = (w / TOTAL) * width;
    const r = bw / 2;
    // Sweep 1 travelling left to right bulges the arc upward.
    d += ` A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${(x + bw).toFixed(2)} ${height.toFixed(2)}`;
    x += bw;
  }
  return `${d} L ${width.toFixed(2)} ${height.toFixed(2)} Z`;
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
  const d = React.useMemo(() => cloudPath(width, height), [width, height]);

  const fillProps = useAnimatedProps(() => ({
    fill: interpolateColor(progress.value, [0, 1], [from, to]),
  }));

  return (
    <Svg width={width} height={height}>
      <AnimatedPath d={d} animatedProps={fillProps} />
    </Svg>
  );
}
