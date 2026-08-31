import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { Road } from '../lib/road';
import { colors, road as roadTokens } from '../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  width: number;
  height: number;
  road: Road;
  /** Bumped when the category changes, to replay the draw-on. */
  drawKey: string;
};

/**
 * The white road and its dashed centre line.
 *
 * On mount the surface draws itself in from the top, then the centre dashes
 * fade up and march slowly along it — the road never sits completely still,
 * but nothing about it moves fast enough to read as a loading state.
 */
export default function SkillRoad({ width, height, road, drawKey }: Props) {
  const total = road.length || 1;
  const { on, off } = roadTokens.dash;
  const period = on + off;

  const draw = useSharedValue(0);
  const march = useSharedValue(0);

  useEffect(() => {
    draw.value = 0;
    draw.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [drawKey, draw]);

  useEffect(() => {
    march.value = 0;
    march.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.linear }),
      -1,
      false,
    );
  }, [march]);

  const surfaceProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - draw.value) * total,
  }));

  const dashProps = useAnimatedProps(() => ({
    // One period per cycle, so the loop is seamless.
    strokeDashoffset: -march.value * period,
    opacity: Math.max(0, (draw.value - 0.45) / 0.55),
  }));

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      {/* Soft ground shadow, so the road sits above the sky rather than in it. */}
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
      {/* Centre line. */}
      <AnimatedPath
        d={road.d}
        stroke={colors.roadDash}
        strokeWidth={roadTokens.dash.width}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${on} ${off}`}
        animatedProps={dashProps}
      />
    </Svg>
  );
}
