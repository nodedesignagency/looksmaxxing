import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GLYPHS } from '../icons/Glyphs';
import type { SkillPath } from '../data/paths';
import { colors, layout, radii, springs, type } from '../theme/tokens';

/**
 * "Frame 2147236480" — a 445px-wide row of 40px chips inside a 390px frame, so
 * it scrolls horizontally. Chip metrics from Figma: 10px padding, a 20x20 icon,
 * text starting at x=36, 8px between chips.
 *
 * The selected state is a single pill that springs between chips rather than
 * four backgrounds toggling, so switching category reads as one movement.
 */

type Props = {
  paths: SkillPath[];
  activeId: string;
  /** Chip ids that lead to a drawn path. Others lean and spring back. */
  available: string[];
  onChange: (id: string) => void;
};

type Slot = { x: number; width: number };

const CHIP_IDLE = 'rgba(255, 255, 255, 0.62)';
const CHIP_CLEAR = 'rgba(255, 255, 255, 0)';

export default function CategoryTabs({ paths, activeId, available, onChange }: Props) {
  const [slots, setSlots] = useState<Record<string, Slot>>({});
  const scroller = useRef<ScrollView>(null);

  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const ready = useSharedValue(0);

  const active = slots[activeId];

  useEffect(() => {
    if (!active) return;
    if (ready.value === 0) {
      // First measurement: place the pill instead of sliding it in from zero.
      pillX.value = active.x;
      pillW.value = active.width;
      ready.value = withTiming(1, { duration: 220 });
    } else {
      pillX.value = withSpring(active.x, springs.glide);
      pillW.value = withSpring(active.width, springs.glide);
    }
    scroller.current?.scrollTo({ x: Math.max(0, active.x - 24), animated: true });
  }, [active, pillX, pillW, ready]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    width: pillW.value,
    opacity: ready.value,
  }));

  const measure = useCallback((id: string, slot: Slot) => {
    setSlots((prev) =>
      prev[id]?.x === slot.x && prev[id]?.width === slot.width ? prev : { ...prev, [id]: slot },
    );
  }, []);

  const select = useCallback(
    (id: string) => {
      if (id === activeId) return;
      if (available.includes(id)) {
        Haptics.selectionAsync().catch(() => {});
        onChange(id);
        return;
      }
      // No path is drawn behind this chip: lean the pill toward the tap and
      // spring it back, rather than switching to an empty trail.
      const target = slots[id];
      if (!active || !target) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const lean = active.x + (target.x - active.x) * 0.26;
      pillX.value = withSequence(
        withSpring(lean, { damping: 18, stiffness: 420 }),
        withSpring(active.x, { damping: 14, stiffness: 240 }),
      );
    },
    [active, activeId, available, onChange, pillX, slots],
  );

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Animated.View style={[styles.pill, pillStyle]} />
      {paths.map((path) => (
        <Chip
          key={path.id}
          path={path}
          selected={path.id === activeId}
          onMeasure={measure}
          onPress={select}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  path,
  selected,
  onPress,
  onMeasure,
}: {
  path: SkillPath;
  selected: boolean;
  onPress: (id: string) => void;
  onMeasure: (id: string, slot: Slot) => void;
}) {
  const Glyph = GLYPHS[path.glyph];
  const sel = useSharedValue(selected ? 1 : 0);
  const press = useSharedValue(0);
  const id = path.id;

  useEffect(() => {
    sel.value = withTiming(selected ? 1 : 0, { duration: 260 });
  }, [selected, sel]);

  const tap = React.useMemo(
    () =>
      Gesture.Tap()
        .onBegin(() => {
          press.value = withSpring(1, springs.press);
        })
        .onFinalize(() => {
          press.value = withSpring(0, springs.press);
        })
        .onEnd(() => {
          runOnJS(onPress)(id);
        }),
    [id, onPress, press],
  );

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.05 }],
    // Fade the chip's own background out so the sliding pill shows through.
    backgroundColor: interpolateColor(sel.value, [0, 1], [CHIP_IDLE, CHIP_CLEAR]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sel.value, [0, 1], [colors.chipText, colors.chipActiveText]),
  }));

  const idleIcon = useAnimatedStyle(() => ({ opacity: 1 - sel.value }));
  const activeIcon = useAnimatedStyle(() => ({ opacity: sel.value }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[styles.chip, chipStyle]}
        onLayout={(e) =>
          onMeasure(id, { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width })
        }
      >
        <View style={styles.chipIcon}>
          <Animated.View style={[StyleSheet.absoluteFill, idleIcon]}>
            <Glyph size={layout.chipIcon} color={colors.chipText} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, activeIcon]}>
            <Glyph size={layout.chipIcon} color={colors.chipActiveText} />
          </Animated.View>
        </View>
        <Animated.Text style={[type.chip, styles.chipText, textStyle]}>{path.label}</Animated.Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
    paddingRight: layout.gutter + 8,
    height: layout.chipHeight,
  },
  chip: {
    height: layout.chipHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.chipPadding,
    marginRight: layout.chipGap,
    borderRadius: radii.chip,
  },
  chipIcon: { width: layout.chipIcon, height: layout.chipIcon },
  chipText: { marginLeft: 6 },
  pill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: layout.chipHeight,
    borderRadius: radii.chip,
    backgroundColor: colors.chipActive,
  },
});
