import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import CategoryTabs from './CategoryTabs';
import type { SkillPath } from '../data/paths';
import { colors, headerMetrics, layout, type } from '../theme/tokens';

/**
 * "Frame 2147236479" — 390x219. Title at (20, 70), chips at (20, 103), and the
 * remaining 76px is a fade so the trail passes underneath rather than being
 * clipped by a hard edge.
 */

type Props = {
  paths: SkillPath[];
  activeId: string;
  onChange: (id: string) => void;
  /** Chip ids that lead to a drawn path. */
  available: string[];
  scrollY: SharedValue<number>;
  topInset: number;
};

export default function Header({
  paths,
  activeId,
  onChange,
  available,
  scrollY,
  topInset,
}: Props) {
  const m = headerMetrics(topInset);

  // A restrained collapse: the title settles back and loosens its grip as you
  // travel down the path, leaving the chips as the persistent control.
  const titleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [0, 120], [0, -8], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [0, 120], [1, 0.9], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(scrollY.value, [0, 120], [1, 0.72], Extrapolation.CLAMP),
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 90], [0.85, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View
        style={[styles.backdrop, { height: m.backdropHeight }, fadeStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['#BFE3FF', '#C6E6FF', 'rgba(203, 231, 255, 0)']}
          locations={[0, m.fadeStart, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={{ paddingTop: m.titleTop }} pointerEvents="box-none">
        <Animated.View style={[styles.titleRow, { height: m.titleRow }, titleStyle]}>
          <Text style={[type.screenTitle, { color: colors.ink }]}>Skill Path</Text>
        </Animated.View>

        <CategoryTabs
          paths={paths}
          activeId={activeId}
          available={available}
          onChange={onChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
  },
});
