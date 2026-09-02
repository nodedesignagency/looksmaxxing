import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
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
 */

type Props = {
  quest: Quest;
  done: boolean;
  onToggle: (id: string) => void;
};

export default function QuestRow({ quest, done, onToggle }: Props) {
  const press = useSharedValue(0);
  const mark = useSharedValue(done ? 1 : 0);

  React.useEffect(() => {
    mark.value = withSpring(done ? 1 : 0, springs.pop);
  }, [done, mark]);

  const fire = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onToggle(quest.id);
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
  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + mark.value * 0.3 }],
    opacity: mark.value,
  }));

  const tall = quest.rewards !== undefined;

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.row, tall && styles.rowTall, rowStyle]}>
        <Image source={CHIP_IMAGES[quest.glyph]} style={styles.icon} resizeMode="contain" />

        <View style={styles.text}>
          <Text style={[type.questTitle, styles.title]} numberOfLines={1}>
            {quest.title}
          </Text>
          <Text style={[type.questSub, styles.body]} numberOfLines={1}>
            {quest.detail}
          </Text>

          {quest.rewards ? (
            // "Frame 2147236453" — three 64x23 pills at 72 apart.
            <View style={styles.pills}>
              {quest.rewards.map((amount, i) => (
                <View key={i} style={styles.pill}>
                  <BoltIcon size={11} color={colors.xpGreen} />
                  <Text style={[type.questReward, styles.xp]}>+{amount} XP</Text>
                </View>
              ))}
            </View>
          ) : (
            // "Frame 2147236453" — XP at x=0, gems at x=56, in an 86-wide row.
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
          )}
        </View>

        {/* "Frame 2147236430" — 24x24, a filled check once the quest is struck
            through and a dashed ring until then. */}
        <View style={[styles.status, !done && styles.statusPending]}>
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
  },
  rowTall: { height: layout.questRowTall },
  icon: { width: layout.questIcon, height: layout.questIcon },
  // 40 from the left edge of the content box, i.e. 8 clear of the 32px sprite.
  text: { flex: 1, marginLeft: layout.questTextLeft - layout.questIcon },
  title: { color: colors.questTitle },
  body: { color: colors.questBody, marginTop: 2 },

  rewards: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  reward: { flexDirection: 'row', alignItems: 'center' },
  rewardGap: { marginLeft: 8 },
  xp: { marginLeft: 4, color: colors.xpGreen },
  gem: { marginLeft: 4, color: colors.gem },

  pills: { flexDirection: 'row', marginTop: 10 },
  pill: {
    width: 64,
    height: 23,
    marginRight: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

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
  },
});
