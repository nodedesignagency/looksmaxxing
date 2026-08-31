import { LinearGradient } from 'expo-linear-gradient';
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
 * The decorative layers behind the trail, positioned at their Figma coordinates:
 *
 *   Ellipse 266   (219, -67)  286x286   sun, top-right
 *   Ellipse 267   (-94, 732)  267x267   cool blob, bottom-left
 *   07_Clouds 1   (-172, 309) 353x196   cloud, off the left edge
 *   08_Clouds 1   (547, 470)  294x261   cloud, off the right edge
 *   image-from-rawpixel (229, 102) 298x199  warm haze, top-right
 *
 * Those layers are raster/vector assets we could not export, so each is
 * reconstructed as a soft vector primitive. They are parallaxed against the
 * scroll position at different rates — the far sun barely moves, the near
 * clouds drift — which is what gives the flat sky depth as you travel the path.
 */

type Props = {
  scrollY: SharedValue<number>;
  /** Total scrollable content height, so the lower layers can be spread out. */
  contentHeight: number;
};

function Cloud({ width, height, opacity }: { width: number; height: number; opacity: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 110">
      {/* One group opacity so the overlapping ellipses read as a single silhouette. */}
      <G opacity={opacity}>
        <Ellipse cx={62} cy={62} rx={44} ry={34} fill={colors.cloud} />
        <Ellipse cx={104} cy={46} rx={38} ry={38} fill={colors.cloud} />
        <Ellipse cx={144} cy={66} rx={40} ry={30} fill={colors.cloud} />
        <Ellipse cx={100} cy={80} rx={80} ry={26} fill={colors.cloud} />
      </G>
    </Svg>
  );
}

function Blob({
  size,
  inner,
  outer,
}: {
  size: number;
  inner: string;
  outer: string;
}) {
  const id = `blob-${inner.replace('#', '')}`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={inner} stopOpacity={0.95} />
          <Stop offset="55%" stopColor={inner} stopOpacity={0.45} />
          <Stop offset="100%" stopColor={outer} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={size / 2} cy={size / 2} rx={size / 2} ry={size / 2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** A slow, never-resting drift so the sky is alive even when nothing is happening. */
function useDrift(distance: number, duration: number, delay = 0) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [duration, t]);
  return useAnimatedStyle(() => ({
    transform: [{ translateX: (t.value - 0.5) * 2 * distance }],
  }));
}

export default function Backdrop({ scrollY, contentHeight }: Props) {
  const parallax = (factor: number) =>
    useAnimatedStyle(() => ({ transform: [{ translateY: -scrollY.value * factor }] }));

  const sun = parallax(0.06);
  const haze = parallax(0.1);
  const cloudLeft = parallax(0.34);
  const cloudRight = parallax(0.26);
  const cloudFar = parallax(0.45);
  const blob = parallax(0.18);

  const driftLeft = useDrift(10, 9000);
  const driftRight = useDrift(14, 11000);
  const driftFar = useDrift(8, 13000);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.skyTop, colors.skyMid, colors.skyLow, colors.skyBottom]}
        locations={[0, 0.34, 0.68, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Ellipse 266 — sun, (219, -67) 286x286 */}
      <Animated.View style={[styles.layer, { top: -67, left: 219 }, sun]}>
        <Blob size={286} inner={colors.sun} outer={colors.sun} />
      </Animated.View>

      {/* image-from-rawpixel — warm haze, (229, 102) 298x199 */}
      <Animated.View style={[styles.layer, { top: 102, left: 229 }, haze]}>
        <Blob size={298} inner={colors.sunCore} outer={colors.sunCore} />
      </Animated.View>

      {/* 07_Clouds 1 — (-172, 309) 353x196 */}
      <Animated.View style={[styles.layer, { top: 309, left: -172 }, cloudLeft]}>
        <Animated.View style={driftLeft}>
          <Cloud width={353} height={196} opacity={0.85} />
        </Animated.View>
      </Animated.View>

      {/* 08_Clouds 1 — (547, 470) 294x261, mostly past the right edge */}
      <Animated.View style={[styles.layer, { top: 470, left: 240 }, cloudRight]}>
        <Animated.View style={driftRight}>
          <Cloud width={294} height={261} opacity={0.7} />
        </Animated.View>
      </Animated.View>

      {/* Ellipse 267 — cool blob, (-94, 732) 267x267 */}
      <Animated.View style={[styles.layer, { top: 732, left: -94 }, blob]}>
        <Blob size={267} inner={colors.blobCool} outer={colors.blobCool} />
      </Animated.View>

      {/* Repeats of the cloud motif further down, so a long path never runs out of sky. */}
      <Animated.View
        style={[styles.layer, { top: contentHeight * 0.62, left: -140 }, cloudFar]}
      >
        <Animated.View style={driftFar}>
          <Cloud width={320} height={178} opacity={0.6} />
        </Animated.View>
      </Animated.View>
      <Animated.View
        style={[styles.layer, { top: contentHeight * 0.86, left: 200 }, cloudLeft]}
      >
        <Animated.View style={driftRight}>
          <Cloud width={300} height={166} opacity={0.55} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute' },
});
