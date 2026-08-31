import React, { useEffect } from 'react';
import {
  Easing,
  interpolate,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Trail } from '../lib/trail';
import { colors } from '../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const RIBBON = 22;

type Props = {
  width: number;
  height: number;
  trail: Trail;
  /** Arc length along the trail that counts as completed. */
  progressLength: number;
  /**
   * Arc length of the first node. The trail runs off the top of the screen, and
   * that lead-in is scenery, not progress — the coloured run starts here.
   */
  startLength: number;
  /** Arc length of the lesson the user is on, for the travelling spark. */
  currentLength: number;
  accent: string;
  /** Bumped when the category changes, to replay the draw-on. */
  drawKey: string;
};

export default function SkillTrail({
  width,
  height,
  trail,
  progressLength,
  startLength,
  currentLength,
  accent,
  drawKey,
}: Props) {
  const total = trail.length || 1;

  // 0 -> 1 draws the whole ribbon on, from the top of the path downward.
  const draw = useSharedValue(0);
  // Eased follower for the completed portion, so finishing a lesson visibly
  // extends the coloured trail rather than snapping it.
  const done = useSharedValue(progressLength);
  // Round caps would poke out past the first node; pull the start back under it.
  const from = Math.max(0, startLength - RIBBON / 2);
  // Loops the spark between the last completed node and the current one.
  const spark = useSharedValue(0);

  useEffect(() => {
    draw.value = 0;
    draw.value = withTiming(1, { duration: 1100, easing: Easing.out(Easing.cubic) });
    done.value = from;
    done.value = withDelay(
      420,
      withTiming(progressLength, { duration: 850, easing: Easing.out(Easing.cubic) }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawKey]);

  useEffect(() => {
    done.value = withTiming(progressLength, { duration: 620, easing: Easing.out(Easing.cubic) });
  }, [progressLength, done]);

  useEffect(() => {
    spark.value = 0;
    spark.value = withDelay(
      900,
      withRepeat(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.quad) }), -1, false),
    );
  }, [drawKey, spark]);

  // Dash the full length off, then pull the offset to zero to draw the ribbon.
  const drawProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - draw.value) * total,
  }));

  // Dash pattern is on/off/on/off: a zero-length lead dash, a gap covering the
  // scenic lead-in, then the completed run, then off for the rest.
  const progressProps = useAnimatedProps(() => ({
    strokeDasharray: [0, from, Math.max(0, done.value - from), total * 2].join(' '),
    opacity: draw.value,
  }));

  const { l, x, y } = trail.poly;

  const sparkAt = useDerivedValue(() => {
    'worklet';
    const from = done.value;
    const to = currentLength;
    return from + (to - from) * spark.value;
  });

  const sparkProps = useAnimatedProps(() => {
    const at = sparkAt.value;
    return {
      cx: interpolate(at, l, x),
      cy: interpolate(at, l, y),
      // Fade in off the completed node and out as it reaches the current one.
      opacity:
        currentLength > done.value + 8
          ? draw.value * Math.sin(spark.value * Math.PI) * 0.9
          : 0,
    };
  });

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      {/* Depth shadow, matching the 2px offset the node buttons use. */}
      <AnimatedPath
        d={trail.d}
        stroke="rgba(15, 37, 64, 0.07)"
        strokeWidth={RIBBON + 3}
        strokeLinecap="round"
        fill="none"
        translateY={5}
        strokeDasharray={`${total} ${total}`}
        animatedProps={drawProps}
      />
      {/* The unwalked trail. */}
      <AnimatedPath
        d={trail.d}
        stroke={colors.trailTrack}
        strokeWidth={RIBBON}
        strokeLinecap="round"
        strokeOpacity={0.88}
        fill="none"
        strokeDasharray={`${total} ${total}`}
        animatedProps={drawProps}
      />
      {/* The portion already earned. */}
      <AnimatedPath
        d={trail.d}
        stroke={accent}
        strokeWidth={RIBBON}
        strokeLinecap="round"
        fill="none"
        animatedProps={progressProps}
      />
      {/* Spark running from where you stopped to where you are going next. */}
      <AnimatedCircle r={5} fill={accent} animatedProps={sparkProps} />
    </Svg>
  );
}
