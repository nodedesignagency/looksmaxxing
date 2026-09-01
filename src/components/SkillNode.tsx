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
import { BoltIcon, CheckIcon, KeyholeIcon, PlayIcon } from '../icons/Glyphs';
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
  onPress: (lesson: Lesson, status: LessonStatus) => void;
  /** Changes when the category switches, to replay the entrance. */
  drawKey: string;
};

const FACE = layout.nodeFace;
const PLATE = layout.nodePlateOffset;

export default function SkillNode({ lesson, status, index, x, y, onPress, drawKey }: Props) {
  const locked = status === 'locked';

  const enter = useSharedValue(0);
  const press = useSharedValue(0);
  const shake = useSharedValue(0);
  const halo = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    enter.value = 0;
    enter.value = withDelay(180 + index * 70, withSpring(1, springs.pop));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawKey]);

  // A slow ring breathing off the lesson you're on.
  useEffect(() => {
    if (status === 'current') {
      halo.value = withRepeat(
        withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      );
    } else {
      cancelAnimation(halo);
      halo.value = 0;
    }
  }, [status, halo]);

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
      { translateY: (1 - enter.value) * 20 },
      { scale: 0.76 + enter.value * 0.24 + pop.value * 0.14 },
    ],
  }));

  // Pressing settles the face down onto its plate, which is exactly the 2px the
  // frame offsets them by — so a press closes the gap the depth is made of.
  const faceStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: press.value * PLATE },
      { translateY: press.value * PLATE },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: (1 - halo.value) * 0.5,
    transform: [{ scale: 1 + halo.value * 0.55 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.03 }],
  }));

  return (
    <Animated.View style={[styles.group, { left: x, top: y }, groupStyle]} pointerEvents="box-none">
      <GestureDetector gesture={tap}>
        <View style={styles.row}>
          <View style={styles.slot}>
            {status === 'current' && (
              <Animated.View style={[styles.halo, haloStyle]} pointerEvents="none" />
            )}
            {/* Child "2": the plate at (2,2) that reads as the circle's edge. */}
            <View
              style={[
                styles.plate,
                { backgroundColor: locked ? colors.nodePlateLocked : colors.nodePlate },
              ]}
            />
            {/* Child "1": the face at (0,0). */}
            <Animated.View
              style={[
                styles.face,
                { backgroundColor: locked ? colors.nodeFaceLocked : colors.nodeFace },
                faceStyle,
              ]}
            >
              <NodeGlyph status={status} locked={locked} />
            </Animated.View>
          </View>

          <Animated.View style={[styles.label, labelStyle]}>
            <Text
              style={[type.nodeTitle, { color: locked ? colors.inkMuted : colors.ink }]}
              numberOfLines={1}
            >
              {lesson.title}
            </Text>
            <View style={[styles.xpPill, locked && styles.xpPillMuted]}>
              <BoltIcon size={12} color={colors.xpGreen} />
              <Text style={[type.xp, styles.xpText]}>+{lesson.xp} XP</Text>
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

function NodeGlyph({ status, locked }: { status: LessonStatus; locked: boolean }) {
  const color = locked ? colors.nodeGlyphLocked : colors.nodeGlyph;
  if (status === 'done') return <CheckIcon size={25} color={color} weight={3.4} />;
  if (status === 'current') return <PlayIcon size={19} color={color} />;
  return <KeyholeIcon size={22} color={color} />;
}

const styles = StyleSheet.create({
  group: { position: 'absolute' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  slot: { width: layout.nodeSize, height: layout.nodeSize },
  halo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: FACE,
    height: FACE,
    borderRadius: radii.node,
    backgroundColor: colors.nodeFace,
  },
  plate: {
    position: 'absolute',
    top: PLATE,
    left: PLATE,
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
    marginTop: 7,
    height: layout.xpPillHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.xpChip,
  },
  xpPillMuted: { backgroundColor: colors.xpChipMuted },
  xpText: { marginLeft: 4, color: colors.xpGreen },
});
