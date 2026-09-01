import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ChunkyButton from './ChunkyButton';
import { BoltIcon, CheckIcon, PlayIcon } from '../icons/Glyphs';
import type { Lesson } from '../data/paths';
import type { LessonStatus } from '../state/useProgress';
import { colors, fonts, radii, springs, type } from '../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The lesson panel, in two acts.
 *
 * It opens as a brief — the node's own circle, its title and its XP — and on
 * "start" the button fills across while the lesson runs. When it lands the
 * whole panel turns green and becomes a result card, which is the moment the
 * confetti fires and the node behind flips to a check.
 *
 * Buttons here are built like the nodes: a face over a darker plate, pressed
 * down onto it. Nothing in the panel is a flat rectangle.
 */

type Props = {
  lesson: Lesson | null;
  status: LessonStatus;
  onClose: () => void;
  onComplete: (lesson: Lesson) => void;
};

/** How long the mock lesson runs before it counts as finished. */
const RUN_MS = 1400;

export default function LessonSheet({ lesson, status, onClose, onComplete }: Props) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const open = useSharedValue(0);
  const drag = useSharedValue(0);
  const run = useSharedValue(0);
  /** 0 while briefing, 1 once the lesson has landed. */
  const win = useSharedValue(0);
  const badge = useSharedValue(0);

  const [shown, setShown] = useState<Lesson | null>(lesson);
  const [phase, setPhase] = useState<'brief' | 'running' | 'done'>('brief');

  useEffect(() => {
    if (lesson) {
      setShown(lesson);
      setPhase(status === 'done' ? 'done' : 'brief');
      run.value = 0;
      drag.value = 0;
      win.value = status === 'done' ? 1 : 0;
      badge.value = status === 'done' ? 1 : 0;
      open.value = withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 });
      return;
    }
    open.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) });
    const t = setTimeout(() => setShown(null), 260);
    return () => clearTimeout(t);
  }, [lesson, status, open, drag, run, win, badge]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: open.value * (1 - Math.min(1, drag.value / 260)),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - open.value) * height * 0.5 + drag.value }],
    opacity: open.value,
    backgroundColor: interpolateColor(
      win.value,
      [0, 1],
      [colors.surface, colors.successTint],
    ),
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + badge.value * 0.4 }],
    opacity: badge.value,
  }));
  // A white face would vanish on the white brief panel and a green one on the
  // green result panel, so both face and plate cross over with the sheet.
  const faceStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(win.value, [0, 1], [colors.tabPill, colors.surface]),
  }));
  const plateStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      win.value,
      [0, 1],
      [colors.nodePlate, colors.successEdge],
    ),
  }));
  const briefStyle = useAnimatedStyle(() => ({
    opacity: 1 - badge.value,
    transform: [{ scale: 1 - badge.value * 0.2 }],
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

  const finish = React.useCallback(() => {
    if (!shown) return;
    setPhase('done');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    win.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) });
    badge.value = withSequence(
      withSpring(1.12, { damping: 9, stiffness: 320 }),
      withSpring(1, springs.pop),
    );
    onComplete(shown);
  }, [shown, onComplete, win, badge]);

  const start = React.useCallback(() => {
    if (!shown || phase !== 'brief') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPhase('running');
    run.value = 0;
    run.value = withTiming(1, { duration: RUN_MS, easing: Easing.inOut(Easing.quad) }, (ok) => {
      if (ok) runOnJS(finish)();
    });
  }, [shown, phase, run, finish]);

  if (!shown) return null;

  const interactive = lesson !== null;
  const done = phase === 'done';
  const running = phase === 'running';

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
          style={[styles.sheet, { paddingBottom: 22 + insets.bottom }, sheetStyle]}
        >
          <View style={styles.grabber} />

          <View style={styles.head}>
            {/* The node's own construction, repeated at sheet scale. */}
            <View style={styles.slot}>
              <Animated.View style={[styles.plate, plateStyle]} />
              <Animated.View style={[styles.face, faceStyle]}>
                <Animated.View style={[StyleSheet.absoluteFill, styles.center, briefStyle]}>
                  <PlayIcon size={22} color={colors.nodeGlyph} />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, styles.center, badgeStyle]}>
                  <CheckIcon size={30} color={colors.xpGreen} weight={3.6} />
                </Animated.View>
              </Animated.View>
            </View>

            <View style={styles.headText}>
              <Text
                style={[
                  type.sheetTitle,
                  { color: done ? colors.xpGreen : colors.nodeTitle },
                ]}
                numberOfLines={2}
              >
                {done ? 'Awesome!' : shown.title}
              </Text>
              <View style={styles.meta}>
                <BoltIcon size={13} color={colors.xpGreen} />
                <Text style={[styles.metaText]}>
                  {done ? `+${shown.xp} XP earned` : `+${shown.xp} XP`}
                </Text>
              </View>
            </View>
          </View>

          <ChunkyButton
            label={done ? 'Continue' : running ? 'Working' : 'Start lesson'}
            face={done ? colors.xpGreen : colors.nodeGlyph}
            edge={done ? colors.successEdge : '#3D6C8A'}
            textColor={colors.surface}
            disabled={running}
            progress={running ? run : undefined}
            onPress={done ? onClose : start}
          />
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
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.roadDash,
    marginBottom: 20,
  },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  slot: { width: 62, height: 62 },
  plate: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 59,
    height: 59,
    borderRadius: 30,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 59,
    height: 59,
    borderRadius: 30,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  headText: { flex: 1, marginLeft: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: {
    marginLeft: 5,
    color: colors.xpGreen,
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: -0.26,
  },
});
