import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCountUp } from './motion';
import { CheckIcon, MedalIcon } from '../../icons/Glyphs';
import type { StreakDay } from '../../data/home';
import { colors, layout, radii, springs, type } from '../../theme/tokens';

/**
 * "Frame 2147236231" — 350x166 at (20, 128).
 *
 * Two plates, and neither is glass. Straight off the inspector: an opaque
 * F6FAFF card at radius 12, 10 padding on three sides and 6 under, holding a
 * white 330x88 plate at radius 8 with 14 padding — both carrying the same 1px
 * inside stroke in ECF0F9, and 6 between them. The week strip below has no fill
 * of its own and sits on the card's own F6FAFF.
 *
 * It was built frosted first, from the render, and that was wrong: F6FAFF over
 * this sky *looks* like glass, and the tell is that the cloud behind it never
 * moves through it. Only the gem pill is real glass on this frame.
 *
 * Both strokes are drawn as inset rings rather than `borderWidth`. Figma's
 * "Inside" stroke paints over the frame without taking layout, but a border in
 * React Native eats into the content box — and this card has no slack to give:
 * 166 is exactly 10 + 88 + 6 + 56 + 6, so a 1px border on each edge overflows
 * it by two and the week strip loses its bottom.
 */

type Props = {
  days: number;
  week: StreakDay[];
};

export default function StreakCard({ days, week }: Props) {
  const shown = useCountUp(days, 700, 320);

  // The medal breathes and tilts on a long loop, out of phase with itself, so
  // it never settles into a rhythm you can predict.
  const bob = useSharedValue(0);
  React.useEffect(() => {
    bob.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [bob]);

  const medalStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bob.value * 3 },
      { rotate: `${(bob.value - 0.5) * 5}deg` },
      { scale: 0.98 + bob.value * 0.04 },
    ],
  }));

  return (
    <View style={styles.card}>
      <View style={styles.cardRing} pointerEvents="none" />

      <View style={styles.plate}>
        <View style={styles.plateRing} pointerEvents="none" />

        {/* "Frame 2147236414" at (14, 20.5), 226 wide. */}
        <View style={styles.headline}>
          <Text style={[type.streakLabel, styles.label]}>CURRENT STREAK</Text>
          <Text style={[type.streakDays, styles.days]}>
            {shown} {days === 1 ? 'Day' : 'Days'}
          </Text>
        </View>
        {/* "Frame 2147236459" — 60x60 at (256, 14). */}
        <Animated.View style={medalStyle}>
          <MedalIcon size={60} />
        </Animated.View>
      </View>

      {/* "Frame 2147236266" — 330x56, seven 44x56 cells 3.67 apart. */}
      <View style={styles.week}>
        {week.map((day, i) => (
          <Day key={day.label} day={day} index={i} />
        ))}
      </View>
    </View>
  );
}

function Day({ day, index }: { day: StreakDay; index: number }) {
  // Struck-through days stamp themselves in, left to right, after the card has
  // arrived — so the streak reads as something that was earned in order.
  const stamp = useSharedValue(day.done ? 0 : 1);
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    if (!day.done) return;
    stamp.value = withDelay(420 + index * 90, withSpring(1, springs.pop));
  }, [day.done, index, stamp]);

  React.useEffect(() => {
    if (!day.today) return;
    pulse.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [day.today, pulse]);

  const stampStyle = useAnimatedStyle(() => ({
    opacity: stamp.value,
    transform: [{ scale: 0.5 + stamp.value * 0.5 }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.55,
    transform: [{ scale: 0.8 + pulse.value * 0.5 }],
  }));

  return (
    <View style={styles.cell}>
      <Text
        style={[type.dayLabel, day.today ? styles.dayLabelToday : styles.dayLabel]}
        numberOfLines={1}
      >
        {day.label}
      </Text>

      {/* A 20x20 mark: a struck-through day carries a check, the rest a date. */}
      <View style={styles.tick}>
        {day.done ? (
          <Animated.View style={[styles.tickDone, stampStyle]}>
            <CheckIcon size={13.33} color={colors.inkMuted} />
          </Animated.View>
        ) : (
          <Text
            style={[type.dayNumber, day.today ? styles.dateToday : styles.date]}
            numberOfLines={1}
          >
            {day.date}
          </Text>
        )}
      </View>

      {/* "Frame 2147236426" — the 4x4 dot under today, and only under today. */}
      <View style={styles.dotSlot}>
        {day.today && <Animated.View style={[styles.dot, dotStyle]} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: layout.streakCard,
    borderRadius: radii.homeCard,
    backgroundColor: colors.streakPlate,
    paddingTop: layout.streakPad,
    paddingLeft: layout.streakPad,
    paddingRight: layout.streakPad,
    paddingBottom: layout.streakPadBottom,
    // The frame's own gap between the white plate and the week strip.
    gap: layout.streakGap,
  },
  plate: {
    height: layout.streakPlate,
    borderRadius: radii.homeInner,
    backgroundColor: colors.streakInner,
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.streakInnerPad,
    gap: layout.streakInnerGap,
  },
  /** ECF0F9 at 1px, inside, on both plates — painted over, never in layout. */
  cardRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.homeCard,
    borderWidth: 1,
    borderColor: colors.cardStroke,
  },
  plateRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.homeInner,
    borderWidth: 1,
    borderColor: colors.cardStroke,
  },
  // 226 of the plate's 302 of content; the medal takes the other 60 plus a 16
  // gap, which is exactly what the frame's auto layout distributes.
  headline: { flex: 1, justifyContent: 'center' },
  label: { color: colors.inkMuted },
  days: { color: colors.heading, marginTop: 4 },

  week: {
    height: layout.weekStrip,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cell: { width: layout.weekCell, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { color: colors.dayLabel },
  dayLabelToday: { color: colors.dayLabelToday },
  tick: {
    marginTop: 7,
    width: layout.weekTick,
    height: layout.weekTick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickDone: {
    width: layout.weekTick,
    height: layout.weekTick,
    borderRadius: layout.weekTick / 2,
    backgroundColor: colors.dayTick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { color: colors.dayLabel },
  dateToday: { color: colors.dayLabelToday },
  // Reserved whether or not the dot is drawn, so today's cell is not a pixel
  // taller than the six beside it.
  dotSlot: { height: 4, marginTop: 5, justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.todayDot },
});
