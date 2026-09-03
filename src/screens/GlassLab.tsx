import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GemIcon } from '../icons/Glyphs';
import { colors, type } from '../theme/tokens';

/**
 * TEMPORARY. Eight gem pills on one sky, so the right one can be picked by eye
 * instead of guessed at.
 *
 * Every render available here is react-native-web, which never executes the iOS
 * path — `isLiquidGlassAvailable()` is hardcoded false on web. So the only way
 * to know what the native glass actually looks like on this sky is to put the
 * candidates on a device together and look. The header prints whether Liquid
 * Glass is available at all, which decides whether rows 1-6 mean anything.
 *
 * Delete this file and its tab once a row is chosen.
 */

const LIQUID = isLiquidGlassAvailable();

type Variant = {
  n: number;
  note: string;
  mode: 'liquid' | 'blur';
  glassStyle?: 'regular' | 'clear';
  tint?: string;
  /** White fill laid over the backdrop, 0-1. */
  fill: number;
  edge?: boolean;
  intensity?: number;
};

const VARIANTS: Variant[] = [
  { n: 1, note: "liquid regular · fill 10%  (Figma's number)", mode: 'liquid', glassStyle: 'regular', fill: 0.1 },
  { n: 2, note: 'liquid regular · fill 22%', mode: 'liquid', glassStyle: 'regular', fill: 0.22 },
  { n: 3, note: 'liquid regular · fill 35%', mode: 'liquid', glassStyle: 'regular', fill: 0.35 },
  { n: 4, note: 'liquid regular · fill 35% · edge', mode: 'liquid', glassStyle: 'regular', fill: 0.35, edge: true },
  { n: 5, note: 'liquid clear · fill 22%', mode: 'liquid', glassStyle: 'clear', fill: 0.22 },
  { n: 6, note: 'liquid regular · white tint · no fill', mode: 'liquid', glassStyle: 'regular', tint: 'rgba(255,255,255,0.45)', fill: 0 },
  { n: 7, note: 'blur 66 · fill 28% · edge', mode: 'blur', intensity: 66, fill: 0.28, edge: true },
  { n: 8, note: 'blur 100 · fill 16% · edge', mode: 'blur', intensity: 100, fill: 0.16, edge: true },
];

export default function GlassLab() {
  const insets = useSafeAreaInsets();
  const sky = React.useRef<View | null>(null);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.skyTop, colors.sky]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* A cloud under the whole column, so every pill has the same thing to
          refract. Without it they all sit on flat colour and look identical. */}
      <Image
        source={require('../../assets/clouds/cloud-main.png')}
        style={styles.cloud}
        resizeMode="cover"
      />

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 40 }}>
        <Text style={styles.head}>
          Liquid Glass available: {LIQUID ? 'YES' : 'NO'}
        </Text>
        <Text style={styles.sub}>
          {LIQUID
            ? 'Rows 1-6 are the real UIGlassEffect. Pick a number.'
            : 'Rows 1-6 have no glass on this device — only 7 and 8 are real.'}
        </Text>

        {VARIANTS.map((v) => (
          <View key={v.n} style={styles.row}>
            <Text style={styles.num}>{v.n}</Text>
            <Pill variant={v} target={sky} />
            <Text style={styles.note}>{v.note}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Pill({ variant, target }: { variant: Variant; target: React.RefObject<View | null> }) {
  const inner = (
    <>
      {variant.fill > 0 && (
        <View
          pointerEvents="none"
          style={[styles.fill, { backgroundColor: `rgba(255,255,255,${variant.fill})` }]}
        />
      )}
      {variant.edge && <View style={styles.edge} pointerEvents="none" />}
      <GemIcon size={20} />
      <Text style={[type.gemCount, styles.count]}>235</Text>
    </>
  );

  if (variant.mode === 'liquid') {
    return (
      <GlassView
        glassEffectStyle={variant.glassStyle}
        tintColor={variant.tint}
        colorScheme="light"
        style={styles.pill}
      >
        {inner}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={variant.intensity}
      tint="light"
      blurTarget={target}
      blurMethod="dimezisBlurViewSdk31Plus"
      style={styles.pill}
    >
      {inner}
    </BlurView>
  );
}

const RADIUS = 43;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sky },
  cloud: { position: 'absolute', top: 120, left: -60, width: 520, height: 700, opacity: 0.95 },
  head: { ...type.welcome, color: '#FFFFFF', marginLeft: 20, marginBottom: 2 },
  sub: { ...type.greeting, color: 'rgba(255,255,255,0.9)', marginLeft: 20, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', marginLeft: 16, marginBottom: 14 },
  num: { ...type.welcome, color: '#FFFFFF', width: 26 },
  note: { ...type.questCount, color: '#FFFFFF', marginLeft: 10, flex: 1 },
  pill: {
    height: 41,
    paddingHorizontal: 10,
    borderRadius: RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: RADIUS },
  edge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  count: { marginLeft: 4, color: '#FFFFFF' },
});
