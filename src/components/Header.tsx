import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CategoryTabs from './CategoryTabs';
import type { SkillPath } from '../data/paths';
import { colors, headerMetrics, layout, type } from '../theme/tokens';

/**
 * "Frame 2147236479" — 390x219. Title at (20, 70), chips at (20, 103), and the
 * remaining 76px is a scrim fading into the sky so the road and first node pass
 * underneath rather than meeting a hard edge.
 *
 * The header is deliberately fixed: it does not react to scroll. Title and chips
 * hold their size and position for the whole travel of the road.
 */

type Props = {
  paths: SkillPath[];
  activeId: string;
  onChange: (id: string) => void;
  topInset: number;
};

export default function Header({ paths, activeId, onChange, topInset }: Props) {
  const m = headerMetrics(topInset);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View
        style={[styles.backdrop, { height: m.scrimHeight }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[colors.skyTop, colors.skyTop, 'rgba(155, 204, 235, 0)']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={{ paddingTop: m.titleTop }} pointerEvents="box-none">
        <View style={[styles.titleRow, { height: m.titleRow }]}>
          <Text style={[type.screenTitle, styles.title]}>Skill Path</Text>
        </View>

        <CategoryTabs paths={paths} activeId={activeId} onChange={onChange} />
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
    justifyContent: 'center',
    paddingHorizontal: layout.gutter,
  },
});
