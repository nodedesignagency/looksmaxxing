import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const barWidth = width - layout.tabBarInset * 2;
  const slot = (barWidth - layout.tabInner * 2) / TABS.length;

  const index = Math.max(
    0,
    TABS.findIndex((t) => t.key === active),
  );
  const pill = useSharedValue(index);

  useEffect(() => {
    pill.value = withSpring(index, springs.glide);
  }, [index, pill]);

  const select = React.useCallback(
    (key: TabKey) => {
      if (available.includes(key)) {
        onChange(key);
        return;
      }
      // Nothing lives here yet: lean the pill toward the tap, then snap back.
      const target = TABS.findIndex((t) => t.key === key);
      pill.value = withSequence(
        withSpring(index + (target - index) * 0.32, { damping: 18, stiffness: 420 }),
        withSpring(index, { damping: 14, stiffness: 260 }),
      );
    },
    [available, index, onChange, pill],
  );

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: layout.tabInner + pill.value * slot }],
  }));

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
        <Animated.View style={[styles.pill, { width: slot }, pillStyle]} />
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

  return (
    <GestureDetector gesture={tap}>
      <View style={styles.tab}>
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
    borderRadius: radii.chip + 4,
    backgroundColor: colors.tabBar,
    paddingHorizontal: layout.tabInner,
    // A soft lift so the bar floats over the trail rather than sitting on it.
    shadowColor: '#0F2540',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: layout.tabInner,
    height: layout.tabBarHeight - layout.tabInner * 2,
    borderRadius: radii.chip,
    backgroundColor: colors.tabPill,
  },
  tab: {
    flex: 1,
    height: layout.tabBarHeight - layout.tabInner * 2,
    alignItems: 'center',
    paddingTop: 8,
  },
  icon: { width: 20, height: 20 },
  label: { marginTop: 4 },
});
