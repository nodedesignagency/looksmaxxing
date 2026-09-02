import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useCountUp } from './motion';
import { BoltIcon, CheckIcon, CrownIcon, KeyholeIcon } from '../../icons/Glyphs';
import { colors, layout, radii, springs, type } from '../../theme/tokens';

/**
 * "Frame 2147236455" — 350x99 at (20, 20) of the sheet.
 *
 * Five 30x20 badges 74 apart across a 326-wide row, over a 6px track. The
 * frame draws the track as two overlapping segments rather than one: the filled
 * one runs 27 -> 188, which is 25px past the third badge's centre. That
 * overshoot is deliberate — it is what makes the fill read as *in progress*
 * rather than stopped exactly on the rung it just cleared — so it is kept, and
 * derived from `reached` so it stays true as the level moves.
 *
 * The track fills on open and each cleared badge stamps in as the fill reaches
 * it, rather than all five being there from the first frame. The timings are
 * derived from the geometry, not typed in: a badge's turn is the fraction of
 * the fill's length at which the fill passes its centre, so the two stay in step
 * whatever the level is.
 */

const BADGE = layout.levelBadge;
/** Half a badge: where the track starts and ends, measured from the row edge. */
const INSET = BADGE.width / 2;
/** The frame's overshoot past the last cleared rung. */
const OVERSHOOT = 25;

type Props = {
  level: number;
  xp: number;
  xpTo: number;
  steps: number[];
  /** How many rungs are behind you. */
  reached: number;
};

/** When the fill starts, and how long it runs. */
const FILL_DELAY = 320;
const FILL_TIME = 760;

export default function LevelCard({ level, xp, xpTo, steps, reached }: Props) {
  const [row, setRow] = React.useState(0);
  const grow = useSharedValue(0);
  const shownXp = useCountUp(xp, 900, FILL_DELAY);

  /**
   * The badge centres, once the row has been measured. The frame spaces them by
   * 74 across 326, which is exactly (width - badge) / (steps - 1) — so this is
   * the frame's own spacing, expressed so it survives a wider handset.
   */
  const centreOf = React.useCallback(
    (i: number) => INSET + (i * (row - BADGE.width)) / Math.max(1, steps.length - 1),
    [row, steps.length],
  );

  const fillTo = reached > 0 ? centreOf(reached - 1) + OVERSHOOT : INSET;

  React.useEffect(() => {
    if (!row) return;
    grow.value = 0;
    grow.value = withDelay(
      FILL_DELAY,
      withTiming(1, { duration: FILL_TIME, easing: Easing.out(Easing.cubic) }),
    );
  }, [row, fillTo, grow]);

  /**
   * When the fill's leading edge crosses a badge, in ms from mount. The fill
   * eases out, so the crossing is not linear in time: invert the cubic to find
   * the moment rather than spacing the badges evenly and drifting out of step.
   */
  const badgeDelay = React.useCallback(
    (i: number) => {
      if (!row || fillTo <= INSET) return FILL_DELAY;
      const at = (centreOf(i) - INSET) / (fillTo - INSET);
      const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, at)), 1 / 3);
      return FILL_DELAY + t * FILL_TIME;
    },
    [row, fillTo, centreOf],
  );

  // Scaled, not widened. Width is a layout property and would re-lay the row
  // out every frame; scaleX off the left edge is a transform the compositor
  // does on its own.
  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: grow.value }],
  }));

  return (
    <View style={styles.card}>
      {/* "Frame 2147236419" — the title row, 326x24. */}
      <View style={styles.top}>
        <View style={styles.titleRow}>
          <CrownIcon size={20} color={colors.levelFill} />
          <Text style={[type.levelTitle, styles.title]}>Level {level}</Text>
        </View>
        <View style={styles.xpRow}>
          <BoltIcon size={13} color={colors.levelFill} />
          <Text style={[type.levelXp, styles.xp]}>
            {shownXp}/{xpTo} XP
          </Text>
        </View>
      </View>

      {/* "Frame 2147236442" — the track, its badges and their labels. */}
      <View style={styles.progress} onLayout={(e) => setRow(e.nativeEvent.layout.width)}>
        <View style={styles.trackRow}>
          <View style={[styles.track, { left: INSET, right: INSET }]} />
          <Animated.View
            style={[styles.track, styles.fill, { left: INSET, width: fillTo - INSET }, fillStyle]}
          />

          {steps.map((step, i) => (
            <Badge
              key={step}
              done={i < reached}
              delay={i < reached ? badgeDelay(i) : 0}
              ready={row > 0}
            />
          ))}
        </View>

        <View style={styles.labels}>
          {steps.map((step) => (
            <Text key={step} style={[type.levelStep, styles.label]} numberOfLines={1}>
              {step} XP
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

/** One rung. A cleared one stamps in as the fill reaches it. */
function Badge({ done, delay, ready }: { done: boolean; delay: number; ready: boolean }) {
  const stamp = useSharedValue(done ? 0 : 1);

  React.useEffect(() => {
    if (!done || !ready) return;
    stamp.value = 0;
    stamp.value = withDelay(delay, withSpring(1, springs.pop));
  }, [done, delay, ready, stamp]);

  const style = useAnimatedStyle(() =>
    done ? { transform: [{ scale: 0.72 + stamp.value * 0.28 }] } : {},
  );

  return (
    <Animated.View style={[styles.badge, done ? styles.badgeDone : styles.badgeLocked, style]}>
      {done ? (
        <CheckIcon size={13.33} color={colors.surface} />
      ) : (
        <KeyholeIcon size={9} color={colors.levelFill} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: layout.levelCard,
    borderRadius: radii.homeInner,
    backgroundColor: colors.levelCard,
    padding: layout.levelPad,
    justifyContent: 'space-between',
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { marginLeft: 4, color: colors.heading },
  xpRow: { flexDirection: 'row', alignItems: 'center' },
  xp: { marginLeft: 4, color: colors.levelFill },

  progress: { height: 39 },
  // The badges are the row; the two track bars sit behind them, inset by half a
  // badge so they run centre to centre.
  trackRow: {
    height: BADGE.height,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  track: {
    position: 'absolute',
    top: (BADGE.height - layout.levelTrackHeight) / 2,
    height: layout.levelTrackHeight,
    borderRadius: layout.levelTrackHeight / 2,
    backgroundColor: colors.levelTrack,
  },
  fill: { backgroundColor: colors.levelFill, transformOrigin: 'left' },
  badge: {
    width: BADGE.width,
    height: BADGE.height,
    borderRadius: BADGE.height / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDone: { backgroundColor: colors.levelFill },
  badgeLocked: { backgroundColor: colors.levelLocked },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  label: { color: colors.heading, textAlign: 'center' },
});
