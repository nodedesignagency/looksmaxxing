import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/tokens';

/**
 * The sky behind the road.
 *
 * The clouds are the design's own photographic plates. They parallax against
 * the scroll at three rates and drift on long loops, which is what keeps a flat
 * sky from reading as wallpaper. Three images cost far less than the ring of
 * gradient ellipses that stood in for them.
 */

type Props = {
  scrollY: SharedValue<number>;
  contentHeight: number;
};

const PLATES = [
  require('../../assets/clouds/cloud-1.png'),
  require('../../assets/clouds/cloud-2.png'),
  require('../../assets/clouds/cloud-3.png'),
];

/** A slow sideways wander, so no two clouds ever line up the same way twice. */
function useDrift(distance: number, duration: number) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [duration, t]);
  return useAnimatedStyle(() => ({
    transform: [{ translateX: (t.value - 0.5) * 2 * distance }],
  }));
}

export default function Backdrop({ scrollY, contentHeight }: Props) {
  const parallax = (factor: number) =>
    useAnimatedStyle(() => ({ transform: [{ translateY: -scrollY.value * factor }] }));

  const far = parallax(0.12);
  const mid = parallax(0.26);
  const near = parallax(0.4);

  const driftA = useDrift(9, 11000);
  const driftB = useDrift(13, 14000);
  const driftC = useDrift(7, 17000);

  // One band per 1600pt of road, so cloud count stays flat as paths grow.
  const bands = Math.max(1, Math.ceil(contentHeight / 1600));

  return (
    <View style={[StyleSheet.absoluteFill, styles.sky]} pointerEvents="none">
      {/* The plates the frame places by hand, near the top of the path. */}
      <Animated.View style={[styles.layer, { top: 120, left: 210 }, far]}>
        <Animated.View style={driftC}>
          <Image source={PLATES[0]} style={styles.wide} resizeMode="contain" />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.layer, { top: 330, left: -150 }, mid]}>
        <Animated.View style={driftA}>
          <Image source={PLATES[1]} style={styles.tall} resizeMode="contain" />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.layer, { top: 520, left: 235 }, near]}>
        <Animated.View style={driftB}>
          <Image source={PLATES[2]} style={styles.wide} resizeMode="contain" />
        </Animated.View>
      </Animated.View>

      {/* Repeats, so a long road never runs out of sky. */}
      {Array.from({ length: bands }, (_, i) => (
        <React.Fragment key={i}>
          <Animated.View style={[styles.layer, { top: 1000 + i * 1600, left: -130 }, mid]}>
            <Animated.View style={driftA}>
              <Image source={PLATES[(i + 1) % 3]} style={styles.tall} resizeMode="contain" />
            </Animated.View>
          </Animated.View>
          <Animated.View style={[styles.layer, { top: 1720 + i * 1600, left: 205 }, near]}>
            <Animated.View style={driftB}>
              <Image source={PLATES[(i + 2) % 3]} style={styles.wide} resizeMode="contain" />
            </Animated.View>
          </Animated.View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sky: { backgroundColor: colors.sky },
  layer: { position: 'absolute' },
  wide: { width: 250, height: 167, opacity: 0.9 },
  tall: { width: 280, height: 155, opacity: 0.85 },
});
