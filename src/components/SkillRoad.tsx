import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import type { Road } from '../lib/road';
import { colors, road as roadTokens } from '../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The white road and its dashed centre line, drawn on once from the top.
 *
 * Sliced into bands rather than one tall SVG. The road runs the length of every
 * category laid end to end — five thousand points and climbing — and a single
 * SVG that size is one enormous layer for the platform to hold and rasterise.
 * Each band draws the same path through a group shifted up by its own offset,
 * and clips to its own height, so no layer is ever taller than BAND.
 */

/** Height of one slice. Small enough to stay cheap, large enough to stay few. */
const BAND = 1100;

type Props = {
  width: number;
  height: number;
  road: Road;
  /** Bumped when the path changes, to replay the draw-on. */
  drawKey: string;
};

export default function SkillRoad({ width, height, road, drawKey }: Props) {
  const total = road.length || 1;
  const { on, off } = roadTokens.dash;

  // 0 -> 1 draws the whole ribbon on, from the top downward.
  const draw = useSharedValue(0);

  useEffect(() => {
    draw.value = 0;
    draw.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [drawKey, draw]);

  // Dash the full length off, then pull the offset to zero to draw the road.
  const surfaceProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - draw.value) * total,
  }));

  const dashProps = useAnimatedProps(() => ({
    opacity: Math.max(0, (draw.value - 0.45) / 0.55),
  }));

  const bands = Math.max(1, Math.ceil(height / BAND));

  return (
    <>
      {Array.from({ length: bands }, (_, i) => {
        const top = i * BAND;
        return (
          <Svg
            key={i}
            width={width}
            height={Math.min(BAND, height - top)}
            style={{ position: 'absolute', top, left: 0 }}
            pointerEvents="none"
          >
            <G translateY={-top}>
              {/* Soft ground shadow, so the road sits above the sky. */}
              <AnimatedPath
                d={road.d}
                stroke={colors.roadShadow}
                strokeWidth={roadTokens.width + 6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                translateY={4}
                strokeDasharray={`${total} ${total}`}
                animatedProps={surfaceProps}
              />
              {/* The surface. */}
              <AnimatedPath
                d={road.d}
                stroke={colors.road}
                strokeWidth={roadTokens.width}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                strokeDasharray={`${total} ${total}`}
                animatedProps={surfaceProps}
              />
              {/* Centre line. Static: marching the dashes meant re-stroking the
                  whole road every frame, forever, for a barely visible drift. */}
              <AnimatedPath
                d={road.d}
                stroke={colors.roadDash}
                strokeWidth={roadTokens.dash.width}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${on} ${off}`}
                animatedProps={dashProps}
              />
            </G>
          </Svg>
        );
      })}
    </>
  );
}
