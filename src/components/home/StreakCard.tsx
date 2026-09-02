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
import Glass from './Glass';
import { useCountUp } from './motion';
import { CheckIcon, MedalIcon } from '../../icons/Glyphs';
import type { StreakDay } from '../../data/home';
import { colors, layout, radii, springs, type } from '../../theme/tokens';

/**
 * "Frame 2147236231" — 350x166 at (20, 128).
 *
 * Two plates, not one: a frosted 350x166 card on the sky holding an opaque
 * 330x88 one at (10, 10), with the week strip below it reading through the
 * frost. That contrast is the card — the sky comes through the outer plate and
 * stops at the inner one, which is what gives the headline something to sit on.
 */

type Props = {
  days: number;
  week: StreakDay[];
  target?: React.RefObject<View | null>;
};

export default function StreakCard({ days, week, target }: Props) {
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
    <Glass style={styles.card} radius={radii.homeCard} target={target}>
      <View style={styles.plate}>
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
    </Glass>
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
  card: { height: layout.streakCard, padding: layout.streakPad },
  plate: {
    height: layout.streakPlate,
    borderRadius: radii.homeInner,
    backgroundColor: colors.streakInner,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 14,
    paddingRight: 14,
  },
  headline: { justifyContent: 'center' },
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
