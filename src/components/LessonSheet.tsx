import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BoltIcon, CheckIcon, PlayIcon } from '../icons/Glyphs';
import type { Lesson } from '../data/paths';
import type { LessonStatus } from '../state/useProgress';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, springs, type } from '../theme/tokens';

type Props = {
  lesson: Lesson | null;
  status: LessonStatus;
  onClose: () => void;
  onComplete: (lesson: Lesson) => void;
};

/** How long the mock "lesson" runs before it counts as finished. */
const RUN_MS = 1400;

export default function LessonSheet({ lesson, status, onClose, onComplete }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const open = useSharedValue(0);
  const drag = useSharedValue(0);
  const run = useSharedValue(0);
  const [running, setRunning] = useState(false);
  // Keeps the last lesson on screen while the sheet animates back down.
  const [shown, setShown] = useState<Lesson | null>(lesson);

  useEffect(() => {
    if (lesson) {
      setShown(lesson);
      setRunning(false);
      run.value = 0;
      drag.value = 0;
      open.value = withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 });
      return;
    }
    open.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) });
    const t = setTimeout(() => setShown(null), 260);
    return () => clearTimeout(t);
  }, [lesson, open, drag, run]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: open.value * (1 - Math.min(1, drag.value / 260)),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - open.value) * height * 0.5 + drag.value }],
    opacity: open.value,
  }));

  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          drag.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
          if (e.translationY > 110 || e.velocityY > 900) {
            drag.value = withTiming(400, { duration: 180 });
            runOnJS(onClose)();
          } else {
            drag.value = withSpring(0, springs.glide);
          }
        }),
    [drag, onClose],
  );

  const tapScrim = React.useMemo(
    () => Gesture.Tap().onEnd(() => runOnJS(onClose)()),
    [onClose],
  );

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: run.value }],
  }));

  const finish = React.useCallback(() => {
    if (!shown) return;
    setRunning(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onComplete(shown);
  }, [shown, onComplete]);

  const start = React.useCallback(() => {
    if (!shown) return;
    if (status === 'done') {
      onClose();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setRunning(true);
    run.value = 0;
    run.value = withTiming(1, { duration: RUN_MS, easing: Easing.inOut(Easing.quad) }, (done) => {
      if (done) runOnJS(finish)();
    });
  }, [shown, status, onClose, run, finish]);

  const button = React.useMemo(
    () => Gesture.Tap().onEnd(() => runOnJS(start)()),
    [start],
  );

  if (!shown) return null;

  const interactive = lesson !== null;
  const isDone = status === 'done';
  const cta = running ? 'In progress…' : isDone ? 'Review lesson' : 'Start lesson';

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={interactive ? 'box-none' : 'none'}
    >
      <GestureDetector gesture={tapScrim}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} />
      </GestureDetector>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.sheet, { paddingBottom: 24 + insets.bottom }, sheetStyle]}
        >
          <View style={styles.grabber} />

          <View style={styles.head}>
            <View style={styles.badge}>
              {isDone ? (
                <CheckIcon size={24} color={colors.checkGlyph} weight={3} />
              ) : (
                <PlayIcon size={19} color={colors.playGlyph} />
              )}
            </View>
            <View style={styles.headText}>
              <Text style={[type.sheetTitle, { color: colors.ink }]}>{shown.title}</Text>
              <View style={styles.meta}>
                <BoltIcon size={12} color={colors.xpBolt} />
                <Text style={[type.xp, { color: colors.xpText, marginLeft: 4 }]}>
                  +{shown.xp} XP
                </Text>
              </View>
            </View>
          </View>

          <GestureDetector gesture={button}>
            <View style={[styles.cta, isDone && styles.ctaDone]}>
              {/* Fills left-to-right while the lesson runs. */}
              <Animated.View
                style={[styles.ctaFill, progressStyle]}
                pointerEvents="none"
              />
              <Text style={[type.button, { color: isDone ? colors.inkMuted : colors.surface }]}>
                {cta}
              </Text>
            </View>
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    backgroundColor: colors.surface,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.roadDash,
    marginBottom: 18,
  },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tabPill,
  },
  headText: { flex: 1, marginLeft: 14 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  cta: {
    height: 54,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.playGlyph,
  },
  ctaDone: { backgroundColor: colors.tabPill },
  ctaFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
    // Scale from the left edge so it reads as a progress bar.
    transformOrigin: 'left',
  },
});
