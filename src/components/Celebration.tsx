import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/tokens';

/**
 * A one-shot particle burst fired from the node that was just completed.
 * Ballistic rather than linear — each piece carries sideways velocity and falls
 * under gravity — because confetti that travels in straight lines reads as a
 * loading spinner, not a reward.
 */

type Props = {
  /** Increment to fire a burst. */
  token: number;
  /** Where the burst originates, in screen coordinates. */
  origin: { x: number; y: number } | null;
  accent: string;
};

const COUNT = 22;
const DURATION = 1150;

type Spec = {
  vx: number;
  vy: number;
  size: number;
  spin: number;
  color: string;
  delay: number;
  radius: number;
};

export default function Celebration({ token, origin, accent }: Props) {
  const palette = useMemo(
    () => [accent, colors.doneFace, colors.currentFace, colors.surface, colors.openFace],
    [accent],
  );

  const specs = useMemo<Spec[]>(() => {
    return Array.from({ length: COUNT }, (_, i) => {
      // Spread mostly upward, with jitter so the fan is not mechanical.
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const speed = 90 + Math.random() * 150;
      const size = 6 + Math.random() * 7;
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        spin: (Math.random() - 0.5) * 900,
        color: palette[i % palette.length],
        delay: Math.random() * 90,
        radius: Math.random() > 0.5 ? size / 2 : 2,
      };
    });
    // A fresh set of trajectories for every burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, palette]);

  if (!origin || token === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {specs.map((spec, i) => (
        <Particle key={`${token}-${i}`} spec={spec} origin={origin} />
      ))}
    </View>
  );
}

function Particle({ spec, origin }: { spec: Spec; origin: { x: number; y: number } }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = 0;
    t.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) });
  }, [t]);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    const gravity = 620;
    return {
      opacity: p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25,
      transform: [
        { translateX: spec.vx * p },
        { translateY: spec.vy * p + 0.5 * gravity * p * p },
        { rotate: `${spec.spin * p}deg` },
        { scale: 1 - p * 0.35 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: origin.x,
          top: origin.y,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.radius,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute' },
});
