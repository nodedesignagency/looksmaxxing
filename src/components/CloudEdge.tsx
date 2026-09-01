import React from 'react';
import Animated, {
  SharedValue,
  interpolateColor,
  useAnimatedProps,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The billowing top edge of the lesson panel.
 *
 * Not a row of tangent semicircles — those meet in a sharp cusp at every
 * valley, which is what makes an edge read as scalloped rather than soft. These
 * are whole circles of deliberately unequal size, centred on the panel's top
 * line and overlapping their neighbours heavily. Every circle is emitted as a
 * subpath of one path wound the same way, so the nonzero fill rule unions them
 * and the valleys come out as the shallow arcs where two circles cross.
 *
 * Centres sit on the top line, so each circle's lower half falls inside the
 * panel body and is clipped away by the SVG's own height.
 */

/**
 * cx as a fraction of width, r as a fraction of width. One dominant lobe with
 * smaller ones around it — even sizes are what make a cloud look manufactured.
 * The outermost centres sit just past the edges so the corners stay covered.
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

/** Tall enough for the biggest lobe to clear the panel's top line. */
export function cloudEdgeHeight(width: number) {
  return Math.round(MAX_R * width);
}

function cloudPath(width: number, height: number) {
  // Two half-arcs per circle, all swept the same way so the union fills solid.
  const circles = LOBES.map(({ cx, r }) => {
    const x = cx * width;
    const rad = r * width;
    return (
      `M ${(x - rad).toFixed(2)} ${height.toFixed(2)}` +
      ` a ${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 1 ${(rad * 2).toFixed(2)} 0` +
      ` a ${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 1 ${(-rad * 2).toFixed(2)} 0 Z`
    );
  });
  // A sliver along the bottom, so no antialiasing seam can open up against the
  // panel body sitting directly beneath.
  const skirt = `M 0 ${(height - 4).toFixed(2)} H ${width.toFixed(2)} V ${height.toFixed(
    2,
  )} H 0 Z`;
  return [...circles, skirt].join(' ');
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
