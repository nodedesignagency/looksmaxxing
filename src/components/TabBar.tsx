import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { CartIcon, ChartIcon, HomeAngleIcon, RouteIcon, type GlyphProps } from '../icons/Glyphs';
import { colors, layout, radii, springs, type } from '../theme/tokens';

/**
 * "mainContainer" / "tabPills" — 354x61 at (18, 763), i.e. 18px side margins and
 * 20px above the 844 baseline. Tabs are 4px inset, with a 20x20 icon 8px from
 * the top and the label below it.
 *
 * The active highlight is a child of its own tab, not a pill positioned over
 * the bar. Sliding one between tabs meant computing its offset against the
 * bar's layout, and it kept landing a few points out — Yoga and CSS disagree on
 * whether an absolutely positioned child clears its parent's padding, so it was
 * correct in a browser and wrong on device. A highlight the tab owns has
 * nothing to compute.
 */

export type TabKey = 'home' | 'path' | 'shop' | 'progress';

const TABS: { key: TabKey; label: string; Icon: React.FC<GlyphProps> }[] = [
  { key: 'home', label: 'Home', Icon: HomeAngleIcon },
  { key: 'path', label: 'Path', Icon: RouteIcon },
  { key: 'shop', label: 'Shop', Icon: CartIcon },
  { key: 'progress', label: 'Progress', Icon: ChartIcon },
];

type Props = {
  active: TabKey;
  onChange: (key: TabKey) => void;
  bottomInset: number;
  /** Drops the bar out of the way while a sheet owns the bottom of the screen. */
  hidden?: boolean;
  /** Tabs that lead somewhere. Anything else rubber-bands and stays put. */
  available?: TabKey[];
};

export default function TabBar({
  active,
  onChange,
  bottomInset,
  hidden = false,
  available = ['path'],
}: Props) {
  const select = React.useCallback(
    (key: TabKey) => {
      if (available.includes(key)) onChange(key);
      // Nothing lives behind the other tabs yet; the press is answered by the
      // tab's own bounce and nothing else moves.
    },
    [available, onChange],
  );

  const away = useSharedValue(0);
  useEffect(() => {
    away.value = withSpring(hidden ? 1 : 0, { damping: 22, stiffness: 240, mass: 0.9 });
  }, [hidden, away]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: away.value * (layout.tabBarHeight + bottomInset + 40) }],
    opacity: 1 - away.value * 0.6,
  }));

  // The design puts the bar 20px above the frame baseline; on devices with a
  // home indicator that gap comes out of the safe-area inset.
  const bottom = Math.max(layout.tabBarBottomGap, bottomInset - 14);

  return (
    <Animated.View
      style={[
        styles.wrap,
        { bottom, left: layout.tabBarInset, right: layout.tabBarInset },
        barStyle,
      ]}
      pointerEvents={hidden ? 'none' : 'auto'}
    >
      <View style={styles.bar}>
        {TABS.map((tab) => (
          <Tab
            key={tab.key}
            tab={tab}
            selected={tab.key === active}
            onPress={select}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function Tab({
  tab,
  selected,
  onPress,
}: {
  tab: { key: TabKey; label: string; Icon: React.FC<GlyphProps> };
  selected: boolean;
  onPress: (key: TabKey) => void;
}) {
  const sel = useSharedValue(selected ? 1 : 0);
  const bounce = useSharedValue(0);
  const { Icon, key } = tab;

  useEffect(() => {
    sel.value = withTiming(selected ? 1 : 0, { duration: 220 });
    if (selected) {
      bounce.value = withSequence(
        withSpring(1, { damping: 8, stiffness: 400 }),
        withSpring(0, springs.pop),
      );
    }
  }, [selected, sel, bounce]);

  const fire = React.useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onPress(key);
  }, [key, onPress]);

  const tap = React.useMemo(
    () => Gesture.Tap().onEnd(() => runOnJS(fire)()),
    [fire],
  );

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + bounce.value * 0.22 },
      { translateY: -bounce.value * 2 },
    ],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sel.value, [0, 1], [colors.tabIdle, colors.tabActive]),
    opacity: 0.75 + sel.value * 0.25,
  }));

  const idle = useAnimatedStyle(() => ({ opacity: 1 - sel.value }));
  const on = useAnimatedStyle(() => ({ opacity: sel.value }));
  const pillStyle = useAnimatedStyle(() => ({ opacity: sel.value }));
  // Icons are 20x20 at (37, 8) inside each tab.

  return (
    <GestureDetector gesture={tap}>
      <View style={styles.tab}>
        {/* Owned by the tab, so it is centred by layout rather than arithmetic. */}
        <Animated.View style={[styles.pill, pillStyle]} pointerEvents="none" />
        <Animated.View style={[styles.icon, iconStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, idle]}>
            <Icon size={20} color={colors.tabIdle} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, on]}>
            <Icon size={20} color={colors.tabActive} weight={2} />
          </Animated.View>
        </Animated.View>
        <Animated.Text style={[type.tab, styles.label, labelStyle]}>{tab.label}</Animated.Text>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  bar: {
    height: layout.tabBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    // "tabPills": radius 9999, 1px inside ECF0F9 stroke, and a drop shadow of
    // x0 y2 blur20 black at 10%. Figma blur is a diameter, iOS shadowRadius a
    // radius, so the blur halves.
    borderRadius: radii.tabBar,
    backgroundColor: colors.tabBar,
    borderWidth: 1,
    borderColor: colors.chipEdge,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  tab: {
    flex: 1,
    height: layout.tabBarHeight - layout.tabInner * 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  pill: {
    position: 'absolute',
    top: 0,
    left: 2,
    right: 2,
    bottom: 0,
    borderRadius: radii.tabPill,
    backgroundColor: colors.tabPill,
  },
  icon: { width: 20, height: 20 },
  label: { marginTop: 4 },
});
