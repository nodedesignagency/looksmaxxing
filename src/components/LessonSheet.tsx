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
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ChunkyButton from './ChunkyButton';
import CloudEdge, { cloudEdgeHeight } from './CloudEdge';
import { BoltIcon, CheckIcon, PlayIcon } from '../icons/Glyphs';
import type { Lesson } from '../data/paths';
import type { LessonStatus } from '../state/useProgress';
import { colors, fonts, springs, type } from '../theme/tokens';
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
  /** Hands off to the interlude; the result card comes back afterwards. */
  onStart: (lesson: Lesson) => void;
};

export default function LessonSheet({ lesson, status, onClose, onStart }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const open = useSharedValue(0);
  const drag = useSharedValue(0);
  /** 0 while briefing, 1 on the result card. */
  const win = useSharedValue(0);
  const badge = useSharedValue(0);

  const [shown, setShown] = useState<Lesson | null>(lesson);
  const done = status === 'done';

  useEffect(() => {
    if (lesson) {
      setShown(lesson);
      drag.value = 0;
      // The panel opens already green on a result, but the check still springs
      // in, so the card lands rather than simply appearing.
      win.value = done ? 1 : 0;
      badge.value = 0;
      open.value = withSpring(1, { damping: 20, stiffness: 200, mass: 0.9 });
      if (done) {
        badge.value = withDelay(
          140,
          withSequence(
            withSpring(1.12, { damping: 9, stiffness: 320 }),
            withSpring(1, springs.pop),
          ),
        );
      }
      return;
    }
    open.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) });
    const t = setTimeout(() => setShown(null), 260);
    return () => clearTimeout(t);
  }, [lesson, done, open, drag, win, badge]);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: open.value * (1 - Math.min(1, drag.value / 260)),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - open.value) * height * 0.6 + drag.value }],
    opacity: open.value,
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(win.value, [0, 1], [colors.surface, colors.successTint]),
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

  const start = React.useCallback(() => {
    if (!shown) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onStart(shown);
  }, [shown, onStart]);

  if (!shown) return null;

  const interactive = lesson !== null;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={interactive ? 'box-none' : 'none'}
    >
      <GestureDetector gesture={tapScrim}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} />
      </GestureDetector>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.sheet, sheetStyle]}>
          {/* Bumpy top edge, in the same colour as the body it sits on. */}
          <CloudEdge
            width={width}
            progress={win}
            from={colors.surface}
            to={colors.successTint}
          />
          <Animated.View
            style={[styles.body, { paddingBottom: 22 + insets.bottom }, bodyStyle]}
          >

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
            label={done ? 'Continue' : 'Start lesson'}
            face={done ? colors.xpGreen : colors.nodeGlyph}
            edge={done ? colors.successEdge : '#3D6C8A'}
            textColor={colors.surface}
            onPress={done ? onClose : start}
          />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: colors.scrim },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  body: { paddingHorizontal: 22, paddingTop: 6 },
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
