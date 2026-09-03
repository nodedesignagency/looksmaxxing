import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BoltIcon, CHIP_IMAGES, CheckIcon, GemIcon } from '../../icons/Glyphs';
import type { Quest } from '../../data/home';
import { colors, layout, radii, springs, type } from '../../theme/tokens';

/**
 * One quest — "Frame 2147236415" and its four siblings.
 *
 * 342 wide, 81 tall (90 for the row carrying three reward pills), inset 12 to a
 * 318x57 content box: a 32x32 sprite, a 242-wide text column 40 in from the
 * left, and a 24x24 status mark hard against the right edge.
 *
 * The sprites are the category chips the Skill Path screen already loads —
 * the frame uses the same three artworks for skincare, fitness and mewing — so
 * they are required from `CHIP_IMAGES` rather than exported again.
 *
 * The text column is held to the frame's 242 by the 12 it keeps clear of the
 * status mark, not left to fill what is spare. That gap is what truncates the
 * body copy at "and Sham…" the way the frame does; letting it run to the mark
 * buys twelve points, and the line fits, and the row stops matching.
 */

type Props = {
  quest: Quest;
  done: boolean;
  /** `at` is where the confetti should come from, in screen coordinates. */
  onToggle: (id: string, at: { x: number; y: number }) => void;
};

export default function QuestRow({ quest, done, onToggle }: Props) {
  const press = useSharedValue(0);
  const mark = useSharedValue(done ? 1 : 0);
  const flash = useSharedValue(0);

  const was = React.useRef(done);
  React.useEffect(() => {
    mark.value = withSpring(done ? 1 : 0, springs.pop);
    // Green washes through the row on the way to done and drains again. It is a
    // beat, not a state: the frame draws a completed row exactly like the rest,
    // so leaving the tint on would be inventing a state it does not have.
    if (done && !was.current) {
      flash.value = withSequence(
        withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 620, easing: Easing.in(Easing.quad) }),
      );
    }
    was.current = done;
  }, [done, mark, flash]);

  /**
   * The burst comes off the status mark, so measure where that actually is
   * rather than guessing from the row: the list scrolls, and a burst a hundred
   * points from the tick reads as a glitch rather than a reward.
   */
  const statusRef = React.useRef<View | null>(null);

  const fire = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const node = statusRef.current;
    if (node) {
      node.measureInWindow((x, y, w, h) => {
        onToggle(quest.id, { x: x + w / 2, y: y + h / 2 });
      });
    } else {
      onToggle(quest.id, { x: 0, y: 0 });
    }
  }, [onToggle, quest.id]);

  const tap = React.useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(10_000)
        .onBegin(() => {
          press.value = withTiming(1, { duration: 90 });
        })
        .onFinalize(() => {
          press.value = withTiming(0, { duration: 140 });
        })
        .onEnd(() => {
          runOnJS(fire)();
        }),
    [fire, press],
  );

  // The row settles a shade rather than shrinking: scaling it would re-raster
  // the title, the body copy and two reward labels on every frame.
  const rowStyle = useAnimatedStyle(() => ({ opacity: 1 - press.value * 0.35 }));

  // The mark overshoots on the way in — it is the one moment on this screen
  // worth a bounce, since it is the only thing you actually did.
  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + mark.value * 0.6 }, { rotate: `${(1 - mark.value) * -35}deg` }],
    opacity: Math.min(1, mark.value * 1.6),
  }));

  const fillStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.85 }));

  // The sprite nods when its row is completed.
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + mark.value * 0.08 }, { rotate: `${mark.value * 6}deg` }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.row, rowStyle]}>
        <Animated.View style={[styles.tint, fillStyle]} pointerEvents="none" />

        {/* The frame sets the sprite on a pale disc rather than the row itself. */}
        <Animated.View style={[styles.iconPlate, iconStyle]}>
          <Image source={CHIP_IMAGES[quest.glyph]} style={styles.icon} resizeMode="contain" />
        </Animated.View>

        <View style={styles.text}>
          <Text style={[type.questTitle, styles.title]} numberOfLines={1}>
            {quest.title}
          </Text>
          <Text style={[type.questBody, styles.body]} numberOfLines={1}>
            {quest.detail}
          </Text>

          {/* "Frame 2147236453" — XP at x=0, gems at x=56, in an 86-wide row. */}
          <View style={styles.rewards}>
            <View style={styles.reward}>
              <BoltIcon size={11} color={colors.xpGreen} />
              <Text style={[type.questReward, styles.xp]}>+{quest.xp} XP</Text>
            </View>
            <View style={[styles.reward, styles.rewardGap]}>
              <GemIcon size={12} />
              <Text style={[type.questReward, styles.gem]}>+{quest.gems}</Text>
            </View>
          </View>
        </View>

        {/* "Frame 2147236430" — 24x24, a filled check once the quest is struck
            through and a dashed ring until then. */}
        <View ref={statusRef} style={[styles.status, !done && styles.statusPending]}>
          {done && (
            <Animated.View style={[styles.statusDone, markStyle]}>
              <CheckIcon size={16} color={colors.surface} />
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: {
    height: layout.questRow,
    borderRadius: radii.questRow,
    backgroundColor: colors.questRow,
    padding: layout.questPad,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: layout.questRowGap,
    // "Clip content", and load-bearing: the mark's glow is a wide, soft blue
    // that the frame cuts off at the row's edge. Uncut it washes over the
    // rows either side.
    overflow: 'hidden',
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.questRow,
    backgroundColor: colors.successTint,
  },
  iconPlate: {
    width: layout.questIcon,
    height: layout.questIcon,
    borderRadius: layout.questIcon / 2,
    backgroundColor: colors.questIconPlate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: layout.questIcon - 4, height: layout.questIcon - 4 },
  // 40 from the left edge of the content box, i.e. 8 clear of the 32px sprite,
  // and 12 clear of the status mark on the other side.
  text: {
    flex: 1,
    marginLeft: layout.questTextLeft - layout.questIcon,
    marginRight: 12,
  },
  title: { color: colors.questTitle },
  body: { color: colors.questBody, marginTop: 2 },

  rewards: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  reward: { flexDirection: 'row', alignItems: 'center' },
  rewardGap: { marginLeft: 8 },
  xp: { marginLeft: 4, color: colors.xpGreen },
  gem: { marginLeft: 4, color: colors.gem },


  status: {
    width: layout.questStatus,
    height: layout.questStatus,
    borderRadius: layout.questStatus / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPending: {
    borderWidth: 1.5,
    borderColor: colors.questPending,
    borderStyle: 'dashed',
  },
  statusDone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: layout.questStatus / 2,
    backgroundColor: colors.questDone,
    alignItems: 'center',
    justifyContent: 'center',
    // Drop shadow 0/8/24 in 51BFFF at 20%. Figma's blur is twice the sigma
    // iOS wants, so 24 there is a shadowRadius of 12 here.
    shadowColor: colors.questDoneGlow,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    shadowOpacity: 0.2,
  },
});
