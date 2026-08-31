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
        style={[styles.backdrop, { height: m.scrimHeight }, fadeStyle]}
        pointerEvents="none"
      >
        {/* Sky-coloured, so the road and first node haze into it as designed. */}
        <LinearGradient
          colors={[colors.skyTop, colors.skyTop, 'rgba(155, 204, 235, 0)']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={{ paddingTop: m.titleTop }} pointerEvents="box-none">
        <Animated.View style={[styles.titleRow, { height: m.titleRow }, titleStyle]}>
          <Text style={[type.screenTitle, styles.title]}>Skill Path</Text>
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
  title: {
    color: colors.title,
    // The frame sets the white title straight on the sky; a soft shadow keeps
    // it legible where a bright cloud drifts underneath.
    textShadowColor: 'rgba(31, 84, 118, 0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.gutter,
  },
});
