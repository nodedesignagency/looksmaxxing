import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { CLIP_SECONDS, LESSON_CLIP } from '../data/lessonClip';
import { colors, fonts, radii, springs } from '../theme/tokens';

/**
 * The interlude between starting a lesson and the result card.
 *
 * It plays the clip named by `src/data/lessonClip.ts`. With that set back to
 * null it runs the scene below instead, which is drawn rather than loaded — so
 * the flow is never broken by a missing asset.
 *
 * Either way it lasts CLIP_SECONDS, and the ring in the corner shows how much
 * of that is left. It can always be skipped.
 */

type Props = {
  visible: boolean;
  onDone: () => void;
};

const RING = 34;

export default function LessonPlayer({ visible, onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const enter = useSharedValue(0);
  const elapsed = useSharedValue(0);

  // Not looped: the clip runs a shade under CLIP_SECONDS, so looping would
  // restart it for a third of a second right at the end. Holding the last frame
  // for that long is the quieter of the two.
  //
  // Unmuted, and left on the default `audioMixingMode` of 'auto'. Whether iOS
  // then sounds it with the ringer switch off is down to the audio session,
  // which expo-video's SDK 57 API does not expose — so if it has to be audible
  // on silent, that is a separate change and not a property of the player.
  const player = useVideoPlayer(LESSON_CLIP, (p) => {
    p.loop = false;
    p.muted = false;
  });

  useEffect(() => {
    if (!visible) {
      enter.value = withTiming(0, { duration: 220 });
      return;
    }
    enter.value = withSpring(1, springs.pop);
    elapsed.value = 0;
    elapsed.value = withTiming(1, {
      duration: CLIP_SECONDS * 1000,
      easing: Easing.linear,
    });
    if (LESSON_CLIP) {
      player.currentTime = 0;
      player.play();
    }
    const t = setTimeout(onDone, CLIP_SECONDS * 1000);
    return () => {
      clearTimeout(t);
      if (LESSON_CLIP) player.pause();
    };
  }, [visible, onDone, enter, elapsed, player]);

  const shellStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: 0.96 + enter.value * 0.04 }],
  }));

  const skip = React.useMemo(
    () => Gesture.Tap().onEnd(() => runOnJS(onDone)()),
    [onDone],
  );

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, shellStyle]}>
      {/* Contained, not covered. The clip is 638x806 — nearly square — and
          covering a 390x844 phone would crop about two fifths of its width,
          taking the sides of the frame with it. The root is near-black, so the
          bars above and below read as letterboxing. */}
      {LESSON_CLIP ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          nativeControls={false}
        />
      ) : (
        <Scene width={width} height={height} />
      )}

      <GestureDetector gesture={skip}>
        <View style={styles.skip}>
          <ProgressRing progress={elapsed} />
          <Text style={styles.skipText}>Skip</Text>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

/** The drawn stand-in: a record deck, a meter, and notes coming off the top. */
function Scene({ width, height }: { width: number; height: number }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['#2B1B5A', '#5B2A8C', '#A83E7C', '#E9705B']}
        locations={[0, 0.38, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      {[...Array(7)].map((_, i) => (
        <Note key={i} index={i} width={width} height={height} />
      ))}
      <View style={styles.stage}>
        <Record />
        <Meter />
        <Wobble>
          <Text style={styles.headline}>NEVER GONNA</Text>
          <Text style={styles.headline}>STOP LEARNING</Text>
        </Wobble>
      </View>
    </View>
  );
}

function Record() {
  const spin = useSharedValue(0);
  const bob = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false);
    bob.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, [spin, bob]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${spin.value * 360}deg` },
      { scale: 1 + bob.value * 0.05 },
    ],
  }));

  return (
    <Animated.View style={[styles.record, style]}>
      <Svg width={168} height={168} viewBox="0 0 168 168">
        <Circle cx={84} cy={84} r={82} fill="#12101C" />
        <Circle cx={84} cy={84} r={82} stroke="rgba(255,255,255,0.18)" strokeWidth={2} fill="none" />
        <Circle cx={84} cy={84} r={62} stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} fill="none" />
        <Circle cx={84} cy={84} r={46} stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} fill="none" />
        <Circle cx={84} cy={84} r={30} fill="#FFC94A" />
        <Circle cx={84} cy={84} r={6} fill="#12101C" />
        {/* The sheen that makes the spin readable. */}
        <Path d="M84 2 A82 82 0 0 1 166 84 L146 84 A62 62 0 0 0 84 22 Z" fill="rgba(255,255,255,0.14)" />
      </Svg>
    </Animated.View>
  );
}

function Meter() {
  return (
    <View style={styles.meter}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <Bar key={i} index={i} />
      ))}
    </View>
  );
}

function Bar({ index }: { index: number }) {
  const t = useSharedValue(0.3);
  useEffect(() => {
    // Prime numbers keep neighbouring bars from falling into lockstep.
    const duration = 280 + ((index * 37) % 200);
    t.value = withDelay(
      index * 60,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
  }, [index, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: 0.25 + t.value * 0.75 }] }));
  return <Animated.View style={[styles.bar, style]} />;
}

function Note({ index, width, height }: { index: number; width: number; height: number }) {
  const t = useSharedValue(0);
  const left = ((index * 53) % 80) + 8;
  const size = 16 + ((index * 7) % 14);
  useEffect(() => {
    t.value = withDelay(
      index * 320,
      withRepeat(withTiming(1, { duration: 3400, easing: Easing.linear }), -1, false),
    );
  }, [index, t]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.sin(t.value * Math.PI) * 0.7,
    transform: [
      { translateY: height * 0.9 - t.value * height * 0.95 },
      { translateX: Math.sin(t.value * Math.PI * 2) * 22 },
      { rotate: `${t.value * 90 - 45}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[styles.note, { left: (left / 100) * width, width: size, height: size }, style]}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d="M19 3.5v10.9a3.3 3.3 0 1 1-2-3V8.2l-7 1.6v7.7a3.3 3.3 0 1 1-2-3V6.1l11-2.6Z"
          fill="rgba(255,255,255,0.85)"
        />
      </Svg>
    </Animated.View>
  );
}

function Wobble({ children }: { children: React.ReactNode }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 620, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
  }, [t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${t.value * 2.5}deg` }, { scale: 1 + Math.abs(t.value) * 0.03 }],
  }));
  return <Animated.View style={[styles.wobble, style]}>{children}</Animated.View>;
}

function ProgressRing({ progress }: { progress: Animated.SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 360}deg` }],
  }));
  return (
    <View style={styles.ring}>
      <Animated.View style={[styles.ringHand, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#12101C' },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  record: { marginBottom: 34 },
  meter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 54,
    gap: 7,
    marginBottom: 30,
  },
  bar: {
    width: 9,
    height: 54,
    borderRadius: 5,
    backgroundColor: '#FFC94A',
    transformOrigin: 'bottom',
  },
  wobble: { alignItems: 'center' },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: 1.5,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  note: { position: 'absolute', top: 0 },
  skip: {
    position: 'absolute',
    top: 58,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 14,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  skipText: {
    marginLeft: 8,
    color: colors.surface,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  ring: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringHand: {
    position: 'absolute',
    width: 2,
    height: RING / 2 - 4,
    top: 3,
    borderRadius: 1,
    backgroundColor: colors.surface,
    transformOrigin: 'bottom',
  },
});
