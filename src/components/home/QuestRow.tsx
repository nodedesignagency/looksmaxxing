import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { captureRef } from 'react-native-view-shot';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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
 *
 * Striking a quest through is one-way, and the row does not stay: the mark
 * lands, the row snapshots itself, and it hands that snapshot up to be blown
 * away as dust while the slot it sat in closes and the rows below rise into
 * the gap. Undo is not offered, which is the point — a quest you did is done.
 */

/** How long the mark takes to land, and so how long until the snapshot. */
const MARK_MS = 260;
/** The slot holds still for a beat before closing, so the dust leads. */
const CLOSE_DELAY = 150;
const CLOSE_MS = 340;

type Props = {
  quest: Quest;
  done: boolean;
  /** True once the snapshot is up and the dust is flying. */
  clearing: boolean;
  /** `at` is where the confetti should come from, in screen coordinates. */
  onTick: (id: string, at: { x: number; y: number }) => void;
  /** The row, as a PNG in base64, and where it was when it was taken. */
  onDust: (
    id: string,
    base64: string | null,
    frame: { x: number; y: number; width: number; height: number },
  ) => void;
};

export default function QuestRow({ quest, done, clearing, onTick, onDust }: Props) {
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

  /** The row itself, which is what gets snapshotted. */
  const rowRef = React.useRef<View | null>(null);

  const fire = React.useCallback(() => {
    // One way. A row already on its way out must not be struck again.
    if (done) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const node = statusRef.current;
    if (node) {
      node.measureInWindow((x, y, w, h) => {
        onTick(quest.id, { x: x + w / 2, y: y + h / 2 });
      });
    } else {
      onTick(quest.id, { x: 0, y: 0 });
    }
  }, [done, onTick, quest.id]);

  /**
   * Once the mark has landed, take the row's picture and hand it up.
   *
   * The snapshot is taken here rather than at the tap because what should come
   * apart is the row you just completed — mark stamped, green still washing
   * through it — not the row as it was a moment before.
   *
   * The frame is measured in window coordinates because the dust is drawn on a
   * canvas over the whole screen, not inside the list.
   */
  React.useEffect(() => {
    if (!done || clearing) return;
    let live = true;
    const timer = setTimeout(async () => {
      const node = rowRef.current;
      const frame = await new Promise<{ x: number; y: number; width: number; height: number }>(
        (resolve) => {
          if (!node) return resolve({ x: 0, y: 0, width: 0, height: 0 });
          node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
        },
      );
      let shot: string | null = null;
      try {
        shot = node ? await captureRef(rowRef, { result: 'base64', format: 'png' }) : null;
      } catch {
        // A row that will not snapshot still leaves the list; it just goes
        // without its dust.
        shot = null;
      }
      if (live) onDust(quest.id, shot, frame);
    }, MARK_MS);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [done, clearing, onDust, quest.id]);

  /** The slot closes once the dust is up, and the rows below come with it. */
  const close = useSharedValue(0);
  React.useEffect(() => {
    if (!clearing) return;
    close.value = withDelay(
      CLOSE_DELAY,
      withTiming(1, { duration: CLOSE_MS, easing: Easing.out(Easing.cubic) }),
    );
  }, [clearing, close]);

  const slotStyle = useAnimatedStyle(() => ({
    height: (1 - close.value) * SLOT,
  }));

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
    <Animated.View style={[styles.slot, slotStyle]}>
      <GestureDetector gesture={tap}>
        <Animated.View
          ref={rowRef}
          collapsable={false}
          style={[styles.row, rowStyle, clearing && styles.handedOver]}
        >
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
    </Animated.View>
  );
}

/** A row and the gap under it: what the slot gives back as it closes. */
const SLOT = layout.questRow + layout.questRowGap;

const styles = StyleSheet.create({
  slot: { height: SLOT, overflow: 'hidden' },
  // Once the snapshot is up, the dust is the row. Leaving this drawn as well
  // would show it collapsing behind its own debris.
  handedOver: { opacity: 0 },
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
