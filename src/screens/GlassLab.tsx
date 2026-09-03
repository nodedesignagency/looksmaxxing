import {
  BackdropFilter,
  Blur,
  Canvas,
  Group,
  Image as SkImage,
  LinearGradient as SkGradient,
  Rect,
  RoundedRect,
  RuntimeShader,
  rrect,
  rect,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FIGMA_GLASS, glassEffect, skiaReady } from '../components/home/glassShader';
import { GemIcon } from '../icons/Glyphs';
import { colors, type } from '../theme/tokens';

/**
 * TEMPORARY. Four gem pills on one sky, so the right one can be picked by eye.
 *
 * Rows 3 and 4 are the Skia lens — the only build here that refracts what is
 * behind the plate, which is what Figma's Glass actually does. They are drawn
 * *inside* the sky's own canvas, because a lens can only bend what its canvas
 * has already painted; a Skia layer floating over React Native views has no
 * backdrop to sample and would come out empty.
 *
 * Delete this file, the block in App.tsx and 'shop' from `available` once a row
 * is chosen.
 */

const LIQUID = isLiquidGlassAvailable();

const PILL = { w: 150, h: 41, r: 43 };
const ROW_H = 78;
const PILL_X = 56;

export default function GlassLab() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const ready = skiaReady();

  const top = insets.top + 96;
  const rowY = React.useCallback((i: number) => top + i * ROW_H, [top]);

  const rows = [
    { n: 1, note: 'blur + fill + hairline  (what ships now, off iOS 26)' },
    { n: 2, note: LIQUID ? 'native Liquid Glass + 10% fill' : 'native Liquid Glass — NOT AVAILABLE' },
    { n: 3, note: ready ? "Skia lens — Figma's numbers" : 'Skia lens — SKIA NOT READY' },
    { n: 4, note: ready ? 'Skia lens — stronger refraction' : 'Skia lens — SKIA NOT READY' },
  ];

  return (
    <View style={styles.root}>
      {ready ? (
        <SkySky top={top} width={width} height={height} rowY={rowY} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.plainSky]} pointerEvents="none" />
      )}

      <Text style={[styles.head, { marginTop: insets.top + 12 }]}>
        Liquid Glass: {LIQUID ? 'YES' : 'NO'} · Skia: {ready ? 'OK' : 'NOT READY'}
      </Text>
      <Text style={styles.sub}>Pick a number.</Text>

      {rows.map((r, i) => (
        <View key={r.n} style={[styles.row, { top: rowY(i) }]}>
          <Text style={styles.num}>{r.n}</Text>
          {i === 0 ? (
            <BlurView intensity={66} tint="light" style={styles.pill}>
              <View style={[styles.fill, styles.fillHeavy]} />
              <View style={styles.hairline} />
              <Content />
            </BlurView>
          ) : i === 1 ? (
            <GlassView glassEffectStyle="regular" colorScheme="light" style={styles.pill}>
              <View style={[styles.fill, styles.fillTen]} />
              <Content />
            </GlassView>
          ) : (
            // The lens itself is painted in the canvas behind; this only carries
            // its contents, so the two have to stay the same size and position.
            <View style={styles.pill}>
              <Content />
            </View>
          )}
          <Text style={styles.note}>{r.note}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * The sky and the two lens pills, in one canvas.
 *
 * Mounted only when Skia can draw. `useImage` is a hook, so it would run even
 * with the canvas unrendered, and it throws while CanvasKit is still coming up.
 */
function SkySky({
  top,
  width,
  height,
  rowY,
}: {
  top: number;
  width: number;
  height: number;
  rowY: (i: number) => number;
}) {
  const cloud = useImage(require('../../assets/clouds/cloud-main.png'));
  const effect = glassEffect();

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Rect x={0} y={0} width={width} height={height}>
        <SkGradient
          start={vec(0, 0)}
          end={vec(0, height * 0.6)}
          colors={[colors.skyTop, colors.sky]}
        />
      </Rect>
      {cloud ? (
        <SkImage image={cloud} x={-40} y={top - 40} width={460} height={430} fit="cover" />
      ) : null}

      {effect
        ? [2, 3].map((i) => {
            const y = rowY(i);
            const strong = i === 3;
            return (
              <Group key={i} clip={rrect(rect(PILL_X, y, PILL.w, PILL.h), PILL.r, PILL.r)}>
                <BackdropFilter
                  filter={
                    <RuntimeShader
                      source={effect}
                      uniforms={{
                        origin: [PILL_X, y],
                        size: [PILL.w, PILL.h],
                        radius: PILL.r,
                        refraction: strong
                          ? FIGMA_GLASS.refraction * 2
                          : FIGMA_GLASS.refraction,
                        depth: PILL.h * FIGMA_GLASS.depthRatio,
                        dispersion: strong
                          ? FIGMA_GLASS.dispersion * 2
                          : FIGMA_GLASS.dispersion,
                        splay: FIGMA_GLASS.splay,
                        light: FIGMA_GLASS.light,
                        lightAmt: FIGMA_GLASS.lightAmt,
                      }}
                    >
                      <Blur blur={FIGMA_GLASS.blur} />
                    </RuntimeShader>
                  }
                />
                {/* The frame's own fill: white at 10%. */}
                <RoundedRect
                  x={PILL_X}
                  y={y}
                  width={PILL.w}
                  height={PILL.h}
                  r={PILL.r}
                  color="rgba(255,255,255,0.1)"
                />
              </Group>
            );
          })
        : null}
    </Canvas>
  );
}

function Content() {
  return (
    <>
      <GemIcon size={20} />
      <Text style={[type.gemCount, styles.count]}>235</Text>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sky },
  plainSky: { backgroundColor: colors.sky },
  head: { ...type.gemCount, color: '#FFFFFF', marginLeft: 20 },
  sub: { ...type.questCount, color: 'rgba(255,255,255,0.9)', marginLeft: 20 },
  row: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center' },
  num: { ...type.welcome, color: '#FFFFFF', width: 24, marginLeft: 18, textAlign: 'center' },
  note: {
    ...type.questCount,
    color: '#FFFFFF',
    position: 'absolute',
    left: PILL_X,
    top: PILL.h + 3,
    right: 12,
  },
  pill: {
    position: 'absolute',
    left: PILL_X,
    width: PILL.w,
    height: PILL.h,
    borderRadius: PILL.r,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: PILL.r },
  fillHeavy: { backgroundColor: 'rgba(255,255,255,0.28)' },
  fillTen: { backgroundColor: 'rgba(255,255,255,0.1)' },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: PILL.r,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  count: { marginLeft: 4, color: '#FFFFFF' },
});
