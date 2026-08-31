import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BoltIcon, CheckIcon, LockIcon, PlayIcon, StarIcon } from '../icons/Glyphs';
import type { Lesson } from '../data/paths';
import type { LessonStatus } from '../state/useProgress';
import { colors, layout, radii, springs, type } from '../theme/tokens';

type Props = {
  lesson: Lesson;
  status: LessonStatus;
  /** Position in the path, used for the entrance stagger. */
  index: number;
  /** Left edge of the 50x50 node frame, in content coordinates. */
  x: number;
  /** Top edge of the 50x50 node frame, in content coordinates. */
  y: number;
  accent: string;
  onPress: (lesson: Lesson, status: LessonStatus) => void;
  /** Changes when the category switches, to replay the entrance. */
  drawKey: string;
};

const FACE = layout.nodeFace;
const OFFSET = layout.nodeShadow;

function faceColors(status: LessonStatus, accent: string) {
  switch (status) {
    case 'done':
      return { face: colors.doneFace, shadow: colors.doneShadow, glyph: colors.onNode };
    case 'current':
      return { face: accent, shadow: shade(accent, 0.72), glyph: colors.onNode };
    case 'open':
      return { face: colors.surface, shadow: colors.lockedShadow, glyph: accent };
    default:
      return { face: colors.lockedFace, shadow: colors.lockedShadow, glyph: colors.lockedGlyph };
  }
}

/** Multiplies a hex colour toward black, for the button's drop face. */
function shade(hex: string, k: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.round(((n >> 16) & 255) * k);
  const g = Math.round(((n >> 8) & 255) * k);
  const b = Math.round((n & 255) * k);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function SkillNode({
  lesson,
  status,
  index,
  x,
  y,
  accent,
  onPress,
  drawKey,
}: Props) {
  const { face, shadow, glyph } = faceColors(status, accent);
  const locked = status === 'locked';

  // Entrance
  const enter = useSharedValue(0);
  // Press depth: 0 raised, 1 fully seated on its shadow.
  const press = useSharedValue(0);
  // Denial shake for locked nodes.
  const shake = useSharedValue(0);
  // Breathing halo on the lesson you're on.
  const halo = useSharedValue(0);
  // Celebration pop when a lesson flips to done.
  const pop = useSharedValue(0);

  useEffect(() => {
    enter.value = 0;
    enter.value = withDelay(
      160 + index * 70,
      withSpring(1, { damping: 13, stiffness: 190, mass: 0.9 }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawKey]);

  useEffect(() => {
    if (status === 'current') {
      halo.value = withRepeat(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(halo);
      halo.value = 0;
    }
  }, [status, halo]);

  // Pop the node the moment it becomes complete.
  const wasDone = React.useRef(status === 'done');
  useEffect(() => {
    if (status === 'done' && !wasDone.current) {
      pop.value = withSequence(
        withSpring(1, { damping: 9, stiffness: 320 }),
        withSpring(0, springs.pop),
      );
    }
    wasDone.current = status === 'done';
  }, [status, pop]);

  const fire = React.useCallback(() => {
    if (locked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      shake.value = withSequence(
        withTiming(-1, { duration: 55 }),
        withTiming(1, { duration: 55 }),
        withTiming(-0.6, { duration: 55 }),
        withTiming(0.6, { duration: 55 }),
        withTiming(0, { duration: 55 }),
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress(lesson, status);
  }, [locked, lesson, onPress, shake, status]);

  const tap = React.useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(10_000)
        .onBegin(() => {
          press.value = withSpring(1, springs.press);
        })
        .onFinalize(() => {
          press.value = withSpring(0, springs.press);
        })
        .onEnd(() => {
          runOnJS(fire)();
        }),
    [fire, press],
  );

  const groupStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { translateX: shake.value * 7 },
      { translateY: (1 - enter.value) * 22 },
      { scale: 0.72 + enter.value * 0.28 + pop.value * 0.16 },
    ],
  }));

  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: press.value * OFFSET },
      { translateY: press.value * OFFSET },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: (1 - halo.value) * 0.45,
    transform: [{ scale: 1 + halo.value * 0.62 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.03 }],
    opacity: 0.45 + enter.value * 0.55,
  }));

  return (
    <Animated.View
      style={[styles.group, { left: x, top: y }, groupStyle]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={tap}>
        <View style={styles.row}>
          {/* 50x50 frame holding the 48x48 face over its 2px-offset shadow. */}
          <View style={styles.slot}>
            {status === 'current' && (
              <Animated.View
                style={[styles.halo, { backgroundColor: accent }, haloStyle]}
                pointerEvents="none"
              />
            )}
            <View style={[styles.shadow, { backgroundColor: shadow }]} />
            <Animated.View style={[styles.face, { backgroundColor: face }, faceStyle]}>
              <NodeGlyph status={status} color={glyph} />
            </Animated.View>
          </View>

          {/* Label block: title, then the "+25 XP" pill. */}
          <Animated.View style={[styles.label, labelStyle]}>
            <Text
              style={[
                type.nodeTitle,
                { color: locked ? colors.inkFaint : colors.ink },
              ]}
              numberOfLines={1}
            >
              {lesson.title}
            </Text>
            <View
              style={[
                styles.xpPill,
                status === 'done' && { backgroundColor: 'rgba(63, 199, 123, 0.16)' },
              ]}
            >
              <BoltIcon
                size={11}
                color={status === 'done' ? colors.doneShadow : colors.xpBolt}
              />
              <Text
                style={[
                  type.xp,
                  styles.xpText,
                  { color: status === 'done' ? colors.doneShadow : colors.xpText },
                ]}
              >
                +{lesson.xp} XP
              </Text>
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

function NodeGlyph({ status, color }: { status: LessonStatus; color: string }) {
  // Icon sizes follow the Figma: check is 24x24 at (12,12), play is 16x16 at (16,16).
  if (status === 'done') return <CheckIcon size={24} color={color} />;
  if (status === 'current') return <StarIcon size={22} color={color} />;
  if (status === 'open') return <PlayIcon size={16} color={color} />;
  return <LockIcon size={18} color={color} />;
}

const styles = StyleSheet.create({
  group: { position: 'absolute' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  slot: {
    width: layout.nodeSize,
    height: layout.nodeSize,
  },
  halo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FACE,
    height: FACE,
    borderRadius: radii.node,
  },
  shadow: {
    position: 'absolute',
    top: OFFSET,
    left: OFFSET,
    width: FACE,
    height: FACE,
    borderRadius: radii.node,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FACE,
    height: FACE,
    borderRadius: radii.node,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginLeft: layout.labelOffsetX - layout.nodeSize,
    marginTop: layout.labelOffsetY,
    alignItems: 'flex-start',
  },
  xpPill: {
    marginTop: 6,
    height: layout.xpPillHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.xpChip,
  },
  xpText: { marginLeft: 4 },
});
