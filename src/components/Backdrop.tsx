import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, G, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/tokens';

/**
 * The sky behind the road.
 *
 * The frame uses photographic cloud plates ("07_Clouds 1", "08_Clouds 1" and an
 * image fill) that could not be exported, so each is stood in for by a cluster
 * of soft-edged ellipses at the same position and scale. They parallax against
 * the scroll at different rates and drift on long loops, which is what keeps a
 * flat sky from reading as wallpaper.
 */

type Props = {
  scrollY: SharedValue<number>;
  contentHeight: number;
};

type Puff = { cx: number; cy: number; rx: number; ry: number; o: number };

/** A soft-edged cloud: overlapping radial-gradient puffs under one group alpha. */
function Cloud({
  width,
  height,
  opacity = 0.9,
  seed,
}: {
  width: number;
  height: number;
  opacity?: number;
  seed: string;
}) {
  const id = `cloud-${seed}`;
  // Four puffs, not six. Every one is a gradient-filled node in the native view
  // tree, and the sky carries several clouds.
  const puffs: Puff[] = [
    { cx: 52, cy: 58, rx: 44, ry: 24, o: 0.85 },
    { cx: 104, cy: 48, rx: 40, ry: 24, o: 0.9 },
    { cx: 80, cy: 74, rx: 74, ry: 16, o: 0.85 },
    { cx: 124, cy: 66, rx: 40, ry: 18, o: 0.7 },
  ];
  return (
    <Svg width={width} height={height} viewBox="0 0 160 100">
      <Defs>
        {/* A long, soft falloff is what makes these read as cloud rather than blob. */}
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={colors.cloud} stopOpacity={0.95} />
          <Stop offset="40%" stopColor={colors.cloud} stopOpacity={0.7} />
          <Stop offset="72%" stopColor={colors.cloud} stopOpacity={0.28} />
          <Stop offset="100%" stopColor={colors.cloud} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <G opacity={opacity}>
        {puffs.map((p, i) => (
          <Ellipse
            key={i}
            cx={p.cx}
            cy={p.cy}
            rx={p.rx}
            ry={p.ry}
            fill={`url(#${id})`}
            opacity={p.o}
          />
        ))}
      </G>
    </Svg>
  );
}

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

  // One repeat per 1600px rather than per 700. The road now runs every category
  // end to end, so tying cloud count to content height quadrupled the sky.
  const repeats = Math.max(1, Math.ceil(contentHeight / 1600));

  return (
    <View style={[StyleSheet.absoluteFill, styles.sky]} pointerEvents="none">
      {/* image-from-rawpixel — (229, 102) 298x199, top right */}
      <Animated.View style={[styles.layer, { top: 120, left: 236 }, far]}>
        <Animated.View style={driftC}>
          <Cloud width={230} height={144} opacity={0.75} seed="a" />
        </Animated.View>
      </Animated.View>

      {/* 07_Clouds 1 — (-172, 309) 353x196, off the left edge */}
      <Animated.View style={[styles.layer, { top: 322, left: -132 }, mid]}>
        <Animated.View style={driftA}>
          <Cloud width={280} height={175} opacity={0.92} seed="b" />
        </Animated.View>
      </Animated.View>

      {/* 08_Clouds 1 — (547, 470), reaching in from the right edge */}
      <Animated.View style={[styles.layer, { top: 512, left: 258 }, near]}>
        <Animated.View style={driftB}>
          <Cloud width={240} height={150} opacity={0.85} seed="c" />
        </Animated.View>
      </Animated.View>

      {/* Repeats, so a scrolled path never runs out of sky. */}
      {Array.from({ length: repeats }, (_, i) => (
        <React.Fragment key={i}>
          <Animated.View
            style={[styles.layer, { top: 900 + i * 1600, left: -110 }, mid]}
          >
            <Animated.View style={driftA}>
              <Cloud width={280} height={175} opacity={0.8} seed={`l${i}`} />
            </Animated.View>
          </Animated.View>
          <Animated.View
            style={[styles.layer, { top: 1620 + i * 1600, left: 232 }, near]}
          >
            <Animated.View style={driftB}>
              <Cloud width={250} height={156} opacity={0.72} seed={`r${i}`} />
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
});
