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
 * The clouds are the design's own plates. The frame composites them in Overlay,
 * which matters: they are grey-white photographs on transparency, and painted
 * normally they sit on the sky as grey smudges. `mixBlendMode` exists in React
 * Native but react-native-web drops it, so it cannot be checked on both targets
 * from one place.
 *
 * They are baked instead, offline, by `scripts/bake-cloud.py`: each plate's own
 * luminance is folded into its alpha and the colour set to white. That lands
 * where Overlay lands and behaves the same everywhere — and, unlike a runtime
 * tint, it keeps the modelling.
 *
 * Tinting was the previous answer here and it only half worked, because the two
 * kinds of plate are built oppositely. `cloud-2` and `cloud-3` are pure white
 * with every highlight in alpha; `cloud-main` was a grey photograph over a hard
 * matte, a fifth of it fully opaque. `tintColor` keeps alpha and discards
 * colour, so on the first kind it changed nothing and on the second it erased
 * the channel the cloud was drawn in, leaving a flat slab with a cut edge among
 * its soft neighbours. Baking makes every plate the first kind, so one rule
 * renders all of them and no tint is needed.
 *
 * The first plate is placed at the frame's own coordinates for
 * `image-from-rawpixel-id-6117623-png 3` — (229, 102) at 298 x 199, pinned to
 * the right edge, so it keeps that offset on a wider handset.
 */

type Props = {
  scrollY: SharedValue<number>;
  contentHeight: number;
};

const MAIN = require('../../assets/clouds/cloud-main.png');
const PLATES = [
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
      {/* image-from-rawpixel-id-6117623-png 3 — (229, 102), 298 x 198.54, right-pinned. */}
      <Animated.View style={[styles.layer, { top: 102, right: -137 }, far]}>
        <Animated.View style={driftC}>
          <Image source={MAIN} style={styles.main} resizeMode="contain" />
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.layer, { top: 340, left: -150 }, mid]}>
        <Animated.View style={driftA}>
          <Image source={PLATES[0]} style={styles.tall} resizeMode="contain" />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.layer, { top: 560, left: 230 }, near]}>
        <Animated.View style={driftB}>
          <Image source={PLATES[1]} style={styles.wide} resizeMode="contain" />
        </Animated.View>
      </Animated.View>

      {/* Repeats, so a long road never runs out of sky. */}
      {Array.from({ length: bands }, (_, i) => (
        <React.Fragment key={i}>
          <Animated.View style={[styles.layer, { top: 1020 + i * 1600, left: -130 }, mid]}>
            <Animated.View style={driftA}>
              <Image source={i % 2 ? MAIN : PLATES[1]} style={styles.tall} resizeMode="contain" />
            </Animated.View>
          </Animated.View>
          <Animated.View style={[styles.layer, { top: 1740 + i * 1600, left: 200 }, near]}>
            <Animated.View style={driftB}>
              <Image source={i % 2 ? PLATES[0] : MAIN} style={styles.wide} resizeMode="contain" />
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
  main: { width: 298, height: 198.54, opacity: 0.85 },
  wide: { width: 250, height: 167, opacity: 0.85 },
  tall: { width: 280, height: 155, opacity: 0.8 },
});
