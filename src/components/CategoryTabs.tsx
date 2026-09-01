import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CHIP_IMAGES } from '../icons/Glyphs';
import type { SkillPath } from '../data/paths';
import { colors, layout, radii, springs, type } from '../theme/tokens';

/**
 * "Frame 2147236480" — a row of 40px chips wider than the 390px frame, so it
 * scrolls horizontally. Chip metrics from Figma: 10px padding, a 20x20 icon,
 * text starting at x=36, 8px between chips.
 *
 * Selection is a plain crossfade of each chip's own background. An earlier
 * version slid a single pill between them, measuring each chip's laid-out x to
 * place it: it read as fussy, and being absolutely positioned it kept landing
 * a few points out. A highlight that belongs to the chip cannot be misplaced.
 */

type Props = {
  paths: SkillPath[];
  activeId: string;
  onChange: (id: string) => void;
};

export default function CategoryTabs({ paths, activeId, onChange }: Props) {
  const scroller = useRef<ScrollView>(null);
  const [slots, setSlots] = useState<Record<string, number>>({});

  // Keep the selected chip in view when the scroll position picks it, not just
  // when it is tapped.
  useEffect(() => {
    const x = slots[activeId];
    if (x === undefined) return;
    scroller.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }, [activeId, slots]);

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
      {paths.map((path, i) => (
        <Chip
          key={path.id}
          path={path}
          selected={path.id === activeId}
          first={i === 0}
          last={i === paths.length - 1}
          onMeasure={(id, x) =>
            setSlots((prev) => (prev[id] === x ? prev : { ...prev, [id]: x }))
          }
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
  onMeasure: (id: string, x: number) => void;
}) {
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
    backgroundColor: interpolateColor(sel.value, [0, 1], [colors.chipIdle, colors.chipActive]),
    borderColor: interpolateColor(sel.value, [0, 1], [colors.chipEdgeIdle, colors.chipEdge]),
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          styles.chip,
          { marginLeft: first ? layout.gutter : 0, marginRight: last ? layout.gutter : layout.chipGap },
          chipStyle,
        ]}
        onLayout={(e) => onMeasure(id, e.nativeEvent.layout.x)}
      >
        <Image
          source={CHIP_IMAGES[path.glyph]}
          style={styles.chipIcon}
          resizeMode="contain"
        />
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
});
