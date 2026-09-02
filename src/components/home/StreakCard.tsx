import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckIcon, MedalIcon } from '../../icons/Glyphs';
import type { StreakDay } from '../../data/home';
import { colors, layout, radii, type } from '../../theme/tokens';

/**
 * "Frame 2147236231" — 350x166 at (20, 128).
 *
 * Two plates, not one: a translucent 350x166 card on the sky holding an opaque
 * 330x88 one at (10, 10), with the week strip below it at (10, 104) in the
 * translucent card's own tint. That is what gives the card an edge without a
 * border — the sky reads through the outer plate and not the inner one.
 */

type Props = {
  days: number;
  week: StreakDay[];
};

export default function StreakCard({ days, week }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.plate}>
        {/* "Frame 2147236414" at (14, 20.5), 226 wide. */}
        <View style={styles.headline}>
          <Text style={[type.streakLabel, styles.label]}>CURRENT STREAK</Text>
          <Text style={[type.streakDays, styles.days]}>
            {days} {days === 1 ? 'Day' : 'Days'}
          </Text>
        </View>
        {/* "Frame 2147236459" — 60x60 at (256, 14). */}
        <MedalIcon size={60} />
      </View>

      {/* "Frame 2147236266" — 330x56, seven 44x56 cells 3.67 apart. */}
      <View style={styles.week}>
        {week.map((day) => (
          <Day key={day.label} day={day} />
        ))}
      </View>
    </View>
  );
}

function Day({ day }: { day: StreakDay }) {
  return (
    <View style={styles.cell}>
      <Text
        style={[type.dayLabel, day.today ? styles.dayLabelToday : styles.dayLabel]}
        numberOfLines={1}
      >
        {day.label}
      </Text>

      {/* A 20x20 mark: a struck-through day carries a check, the rest a date. */}
      <View style={[styles.tick, day.done && styles.tickDone]}>
        {day.done ? (
          <CheckIcon size={13.33} color={colors.inkMuted} />
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
      <View style={styles.dotSlot}>{day.today && <View style={styles.dot} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: layout.streakCard,
    borderRadius: radii.homeCard,
    backgroundColor: colors.streakPlate,
    padding: layout.streakPad,
  },
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
  days: { color: colors.heading, marginTop: 6 },

  week: {
    height: layout.weekStrip,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cell: {
    width: layout.weekCell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: { color: colors.dayLabel },
  dayLabelToday: { color: colors.dayLabelToday },
  tick: {
    marginTop: 8,
    width: layout.weekTick,
    height: layout.weekTick,
    borderRadius: layout.weekTick / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickDone: { backgroundColor: colors.dayTick },
  date: { color: colors.dayLabel },
  dateToday: { color: colors.dayLabelToday },
  // Reserved whether or not the dot is drawn, so today's cell is not a pixel
  // taller than the six beside it.
  dotSlot: { height: 4, marginTop: 4, justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.todayDot },
});
