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
 * "Frame 2147236231" — 350x166 at (20, 128). Transcribed from the design
 * context for node 23:10572, not from the render.
 *
 * An opaque F6FAFF card at radius 12 — no glass anywhere on it — with a 1px
 * inside stroke in ECF0F9, 10 padding on three sides and 6 under, holding a
 * white plate at radius 8 with the same stroke, 14 padding and a 16 gap. The
 * week strip below has no fill of its own and sits on the card's F6FAFF.
 *
 * Both strokes are inset rings rather than `borderWidth`. Figma's "Inside"
 * stroke paints over a frame without taking layout; a border in React Native
 * eats into the content box, and this card has no slack — 166 is exactly
 * 10 + 88 + 6 + 56 + 6, so a border on each edge overflows it by two.
 *
 * The medal is positioned, not laid out: a 176x117 raster centred on a 60x60
 * box, which is why it reaches past that box on three sides. The plate clips
 * it, and the artwork's own transparent padding is what keeps the sparkles
 * inside that clip.
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

        {/* "Frame 2147236414" — flex-1, its two lines 14 apart. */}
        <View style={styles.headline}>
          <Text style={[type.streakLabel, styles.label]}>Current Streak</Text>
          <Text style={[type.streakDays, styles.days]}>
            {shown} {days === 1 ? 'Day' : 'Days'}
          </Text>
        </View>

        {/* "Frame 2147236459" — a 60x60 box the raster is centred on. */}
        <Animated.View style={medalStyle}>
          <MedalIcon size={60} />
        </Animated.View>
      </View>

      {/* "Frame 2147236266" — seven 44-wide cells, spread. */}
      <View style={styles.week}>
        {week.map((day, i) => (
          <Day key={day.label} day={day} index={i} />
        ))}
      </View>
    </View>
  );
}

/** One 44x56 cell: its label at the top, its mark at the bottom, 10 inset. */
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
        style={[type.dayLabel, day.today ? styles.labelToday : styles.labelPast]}
        numberOfLines={1}
      >
        {day.label}
      </Text>

      <View style={styles.mark}>
        {day.done ? (
          <Animated.View style={[styles.tick, stampStyle]}>
            <CheckIcon size={13.333} color={colors.inkMuted} />
          </Animated.View>
        ) : (
          <Text
            style={[type.dayNumber, day.today ? styles.dateToday : styles.date]}
            numberOfLines={1}
          >
            {day.date}
          </Text>
        )}

        {/* Hung below the mark rather than stacked under it, so today's cell is
            not a pixel taller than the six beside it. */}
        {day.today && <Animated.View style={[styles.dot, dotStyle]} />}
      </View>
    </View>
  );
}

const RING = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderWidth: 1,
  borderColor: colors.cardStroke,
} as const;

const styles = StyleSheet.create({
  card: {
    height: layout.streakCard,
    borderRadius: radii.homeCard,
    backgroundColor: colors.streakPlate,
    paddingTop: layout.streakPad,
    paddingLeft: layout.streakPad,
    paddingRight: layout.streakPad,
    paddingBottom: layout.streakPadBottom,
    gap: layout.streakGap,
    overflow: 'hidden',
  },
  cardRing: { ...RING, borderRadius: radii.homeCard },

  plate: {
    height: layout.streakPlate,
    borderRadius: radii.homeInner,
    backgroundColor: colors.streakInner,
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.streakInnerPad,
    gap: layout.streakInnerGap,
    overflow: 'hidden',
  },
  plateRing: { ...RING, borderRadius: radii.homeInner },

  /**
   * The frame's gap here is 14, and setting 14 is wrong.
   *
   * Figma trims these two text boxes to their caps (`text-box-trim: trim-both`),
   * so its gap is measured ink to ink. React Native lays out line boxes, which
   * carry leading above and below the glyphs — 8.2pt of it across these two
   * faces, measured off the render. Setting 14 here put 22.2 between the caps
   * and pushed the block past the plate's 60 of content. The gap is the frame's
   * 14 less that leading.
   */
  headline: { flex: 1, alignItems: 'flex-start', gap: 14 - 8.2 },
  label: { color: colors.streakLabel, textTransform: 'uppercase' },
  days: { color: colors.streakDays },

  week: {
    height: layout.weekStrip,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cell: {
    width: layout.weekCell,
    height: layout.weekStrip,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelPast: { color: colors.dayLabel },
  labelToday: { color: colors.dayLabelToday },
  mark: {
    width: layout.weekTick,
    height: layout.weekTick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    width: layout.weekTick,
    height: layout.weekTick,
    borderRadius: layout.weekTick / 2,
    backgroundColor: colors.dayTick,
    alignItems: 'center',
    justifyContent: 'center',
  },
  date: { color: colors.dayLabel },
  dateToday: { color: colors.dayLabelToday },
  dot: {
    position: 'absolute',
    bottom: -4.78,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.todayDot,
  },
});
