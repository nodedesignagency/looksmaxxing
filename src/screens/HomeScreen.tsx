import { BlurTargetView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import Celebration from '../components/Celebration';
import Glass from '../components/home/Glass';
import LevelCard from '../components/home/LevelCard';
import QuestRow from '../components/home/QuestRow';
import StreakCard from '../components/home/StreakCard';
import { Rise, useCountUp } from '../components/home/motion';
import { AvatarGlyph, GemIcon } from '../icons/Glyphs';
import { GEMS, LEVEL, PLAYER, QUESTS, SEED_DONE, STREAK } from '../data/home';
import { colors, layout, radii, type } from '../theme/tokens';

/**
 * "Home" — node 23:10380, 390x844.
 *
 * Three bands stacked on the sky, all of them scrolling together:
 *
 *   greeting     350x42 at (20, 70)
 *   streak card  350x166 at (20, 128)
 *   sheet        390x673 at (0, 310) — level card, then the quest list
 *
 * The frame's own vertical rhythm is a flat 16 between those bands, so they are
 * laid out in flow rather than pinned: the geometry is transcribed as paddings
 * and heights, which keeps it exact at 390 and sane on anything wider.
 *
 * Geometry and copy are exact — one `get_metadata` call returned before the
 * Figma MCP connection hit its cap, and it carries every position, size and
 * string in the frame. Colour is read off the render, because
 * `get_variable_defs` refuses along with everything else and the public embed
 * is blocked by this session's egress policy. Type sizes are solved rather than
 * read: see the note on the Home block in `tokens.ts`.
 *
 * The sky is a `BlurTargetView` because SDK 57's Android blur reads from one
 * rather than from whatever happens to be behind the view. Its ref goes down to
 * every frosted plate on the screen.
 */

const GUTTER = layout.homeGutter;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const sky = useRef<View | null>(null);

  const [done, setDone] = useState<string[]>(SEED_DONE);
  const [burst, setBurst] = useState(0);
  const [burstAt, setBurstAt] = useState<{ x: number; y: number } | null>(null);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  /**
   * Striking a quest through fires confetti from its own mark; clearing one
   * does not. Undo is a correction, and rewarding it teaches the wrong thing.
   */
  const toggle = useCallback((id: string, at: { x: number; y: number }) => {
    setDone((prev) => {
      if (prev.includes(id)) return prev.filter((q) => q !== id);
      setBurstAt(at);
      setBurst((n) => n + 1);
      return [...prev, id];
    });
  }, []);

  /**
   * "3/5 completed".
   *
   * Counted, not transcribed. The frame's label reads 3/5 while it draws checks
   * on two of the five rows — a comp's placeholder rather than a spec — and a
   * number that disagrees with the marks beside it is worse than one that moves.
   */
  const completed = useMemo(() => QUESTS.filter((q) => done.includes(q.id)).length, [done]);

  const gems = useCountUp(GEMS, 1000, 220);

  return (
    <View style={styles.root}>
      <Sky innerRef={sky} scrollY={scrollY} />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 11 }}
      >
        {/* "Frame 2147235537" — 350x42. */}
        <Rise index={0} style={styles.greetingRow}>
          <View>
            <Text style={[type.greeting, styles.greeting]}>Hi, {PLAYER.name}</Text>
            <Text style={[type.welcome, styles.welcome]}>Welcome Back</Text>
          </View>

          <View style={styles.account}>
            {/* "Frame 2147235516" — a 74x41 pill: gem at 10, count at 34. */}
            {/* Radius 43, per the inspector — past half its 41 of height, so it
                capsules, and a real number is what the native glass wants. */}
            <Glass style={styles.gemPill} radius={43} target={sky}>
              <GemIcon size={20} />
              <Text style={[type.gemCount, styles.gemCount]}>{gems}</Text>
            </Glass>
            {/* "Avatar [1.0]" — 40x40. The artwork is its own circle, so it
                needs no plate behind it and no clipping. */}
            <View style={styles.avatar}>
              <AvatarGlyph size={40} />
            </View>
          </View>
        </Rise>

        <Rise index={1} style={styles.streak}>
          <StreakCard days={STREAK.days} week={STREAK.week} />
        </Rise>

        {/*
          "Frame 2147236253" — the sheet the rest of the screen sits on.

          The room for the tab bar is padding on the sheet rather than on the
          scroll's content container, so the white runs the whole way down and
          under the bar. On the container it ends with the last quest and the
          sky shows through the gap.
        */}
        <View
          style={[
            styles.sheet,
            { paddingBottom: layout.tabBarHeight + layout.tabBarBottomGap + insets.bottom + 24 },
          ]}
        >
          <Rise index={2}>
            <LevelCard
              level={LEVEL.level}
              xp={LEVEL.xp}
              xpTo={LEVEL.xpTo}
              steps={LEVEL.steps}
              reached={LEVEL.reached}
            />
          </Rise>

          {/*
            "Frame 2147236454" — a card in its own right, 350x497, not a bare
            run of rows on the sheet. White on white, so the hairline is the
            only thing that separates them, and its 4 of padding is what insets
            every row from the level card above.
          */}
          <View style={styles.quests}>
            <View style={styles.questsRing} pointerEvents="none" />

            <Rise index={3} style={styles.questHead}>
              <View style={styles.questHeadText}>
                <Text style={[type.questHeading, styles.questHeading]}>Today’s Quest</Text>
                <Text style={[type.questSub, styles.questSubhead]}>Quests resets at midnight</Text>
              </View>

              {/* "Frame 2147236451" — a 105x26 pill around an 18x18 ring. Solid
                  white, not frosted: it sits on the sheet rather than the sky,
                  and there is nothing behind it worth blurring. */}
              <View style={styles.countPill}>
                <Ring done={completed} total={QUESTS.length} />
                <Text style={[type.questCount, styles.countText]}>
                  {completed}/{QUESTS.length} completed
                </Text>
              </View>
            </Rise>

            {QUESTS.map((quest, i) => (
              <Rise key={quest.id} index={4 + i}>
                <QuestRow quest={quest} done={done.includes(quest.id)} onToggle={toggle} />
              </Rise>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      <Celebration token={burst} origin={burstAt} />
    </View>
  );
}

/**
 * The sky behind it all.
 *
 * The frame lays a wide cloud plate off the right edge and drops two soft
 * ellipses on top — one at (219, -67), one at (-94, 732). Those ellipses are
 * blurred cloud in the render rather than hard circles, so the same plates the
 * Skill Path backdrop uses stand in for them: they are already the right
 * softness, and they keep the two screens' skies identical.
 *
 * They travel at two rates against the scroll and drift on long loops of their
 * own, which is what stops the sky reading as wallpaper — and it is the motion
 * the frosted cards need to have anything to blur.
 */
function Sky({
  innerRef,
  scrollY,
}: {
  innerRef: React.RefObject<View | null>;
  scrollY: SharedValue<number>;
}) {
  const driftA = useDrift(10, 13000);
  const driftB = useDrift(14, 17000);

  const far = useAnimatedStyle(() => ({ transform: [{ translateY: -scrollY.value * 0.14 }] }));
  const near = useAnimatedStyle(() => ({ transform: [{ translateY: -scrollY.value * 0.3 }] }));

  return (
    <BlurTargetView ref={innerRef} style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.skyTop, colors.sky]}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.cloudTop, far]}>
        <Animated.View style={driftA}>
          <Image
            source={require('../../assets/clouds/cloud-main.png')}
            style={styles.cloudTopArt}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.cloudLeft, near]}>
        <Animated.View style={driftB}>
          <Image
            source={require('../../assets/clouds/cloud-3.png')}
            style={styles.cloudLeftArt}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>
    </BlurTargetView>
  );
}

/** A slow sideways wander, so no two clouds line up the same way twice. */
function useDrift(distance: number, duration: number) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [duration, t]);
  return useAnimatedStyle(() => ({
    transform: [{ translateX: (t.value - 0.5) * 2 * distance }],
  }));
}

/**
 * The 18x18 "Circular Progress Bar [1.0]" in the quest header.
 *
 * The arc sweeps to its new length rather than jumping, so striking a quest
 * through has somewhere to land besides the row itself.
 */
const R = 7;
const C = 2 * Math.PI * R;

function Ring({ done, total }: { done: number; total: number }) {
  const at = useSharedValue(0);
  const goal = total > 0 ? done / total : 0;

  React.useEffect(() => {
    at.value = withDelay(
      420,
      withTiming(goal, { duration: 620, easing: Easing.out(Easing.cubic) }),
    );
  }, [goal, at]);

  const props = useAnimatedProps(() => ({
    strokeDasharray: [C * at.value, C],
  }));

  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Circle cx={9} cy={9} r={R} stroke={colors.questPending} strokeWidth={2.5} fill="none" />
      <AnimatedCircle
        cx={9}
        cy={9}
        r={R}
        stroke={colors.questDone}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`0 ${C}`}
        animatedProps={props}
        // Start the sweep at twelve o'clock rather than three.
        transform="rotate(-90 9 9)"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sky },

  cloudTop: { position: 'absolute', top: 30, right: -120 },
  cloudTopArt: { width: 360, height: 240, opacity: 0.95 },
  cloudLeft: { position: 'absolute', top: 330, left: -130 },
  cloudLeftArt: { width: 300, height: 200, opacity: 0.8 },

  greetingRow: {
    marginHorizontal: GUTTER,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Both lines are white on the sky, not ink. The comp reads the other way
  // round only because a screenshot of the sky is lighter than the sky is.
  greeting: { color: colors.greeting },
  welcome: { color: colors.greetingHeavy, marginTop: 2 },

  account: { flexDirection: 'row', alignItems: 'center' },
  gemPill: {
    height: 41,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // White, like the greeting beside it. On a plate you can see the sky through,
  // ink is the one thing that reads as pasted on.
  gemCount: { marginLeft: 4, color: colors.greetingHeavy },
  avatar: { marginLeft: 16 },

  streak: { marginHorizontal: GUTTER, marginTop: 16 },

  sheet: {
    marginTop: 16,
    paddingTop: 20,
    paddingHorizontal: GUTTER,
    borderTopLeftRadius: radii.homeSheet,
    borderTopRightRadius: radii.homeSheet,
    backgroundColor: colors.sheet,
  },

  quests: {
    marginTop: 16,
    backgroundColor: colors.sheet,
    borderRadius: radii.questCard,
    // 4 all round bar the top, which the frame gives 16. The last row's own
    // 4 of margin is the bottom padding, so the card does not add a second.
    paddingTop: 16,
    paddingHorizontal: 4,
  },
  questsRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.questCard,
    borderWidth: 1,
    borderColor: colors.cardStroke,
  },
  // "Frame 2147236414" — 342x43, its content 12 in from the card's own 4.
  questHead: {
    height: 43,
    paddingHorizontal: 12,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  questHeadText: { flex: 1 },
  questHeading: { color: colors.heading },
  questSubhead: { color: colors.questBody, marginTop: 4 },
  countPill: {
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.questPending,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: { marginLeft: 6, color: colors.questTitle },
});
