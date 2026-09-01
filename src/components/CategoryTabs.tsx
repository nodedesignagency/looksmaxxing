import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CHIP_ICONS } from '../icons/Glyphs';
import type { SkillPath } from '../data/paths';
import { colors, layout, radii, springs, type } from '../theme/tokens';

/**
 * "Frame 2147236480" — a row of 40px chips wider than the 390px frame, so it
 * scrolls horizontally. Chip metrics from Figma: 10px padding, a 20x20 icon,
 * text starting at x=36, 8px between chips.
 *
 * Selection is one white pill that springs between chips, rather than four
 * backgrounds toggling, so switching category reads as a single movement.
 *
 * The row deliberately carries no horizontal padding: the pill is absolutely
 * positioned and measured against each chip's laid-out x, and Yoga offsets
 * absolute children by the parent's padding while CSS does not — so any padding
 * here would put the pill in the right place on web and the wrong place on
 * device. The gutters are chip margins instead.
 */

type Props = {
  paths: SkillPath[];
  activeId: string;
  onChange: (id: string) => void;
};

type Slot = { x: number; width: number };

/** The pill supplies the selected fill, so the chip's own fades out under it. */
const CHIP_CLEAR = 'rgba(195, 221, 239, 0)';

export default function CategoryTabs({ paths, activeId, onChange }: Props) {
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
      Haptics.selectionAsync().catch(() => {});
      onChange(id);
    },
    [activeId, onChange],
  );

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <Animated.View style={[styles.pill, pillStyle]} />
      {paths.map((path, i) => (
        <Chip
          key={path.id}
          path={path}
          selected={path.id === activeId}
          first={i === 0}
          last={i === paths.length - 1}
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
  first,
  last,
  onPress,
  onMeasure,
}: {
  path: SkillPath;
  selected: boolean;
  first: boolean;
  last: boolean;
  onPress: (id: string) => void;
  onMeasure: (id: string, slot: Slot) => void;
}) {
  const Icon = CHIP_ICONS[path.glyph];
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
    backgroundColor: interpolateColor(sel.value, [0, 1], [colors.chipIdle, CHIP_CLEAR]),
    borderColor: interpolateColor(sel.value, [0, 1], [colors.chipEdgeIdle, CHIP_CLEAR]),
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          styles.chip,
          { marginLeft: first ? layout.gutter : 0, marginRight: last ? layout.gutter : layout.chipGap },
          chipStyle,
        ]}
        onLayout={(e) =>
          onMeasure(id, { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width })
        }
      >
        <View style={styles.chipIcon}>
          <Icon size={layout.chipIcon} />
        </View>
        <Animated.Text style={[type.chip, styles.chipText]}>{path.label}</Animated.Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', height: layout.chipHeight },
  chip: {
    height: layout.chipHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.chipPadding,
    borderRadius: radii.chip,
    borderWidth: 1,
  },
  chipIcon: { width: layout.chipIcon, height: layout.chipIcon },
  chipText: { marginLeft: layout.chipGapInner, color: colors.ink },
  pill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: layout.chipHeight,
    borderRadius: radii.chip,
    backgroundColor: colors.chipActive,
    borderWidth: 1,
    borderColor: colors.chipEdge,
  },
});
