import {
  Canvas,
  Fill,
  Group,
  Image as SkImage,
  ImageShader,
  LinearGradient as SkGradient,
  Rect,
  Shader,
  Skia,
  rect,
  rrect,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import Celebration from '../components/Celebration';
import Glass from '../components/home/Glass';
import { FIGMA_GLASS, GLASS_SKSL } from '../components/home/glassShader';
import LevelCard from '../components/home/LevelCard';
import QuestRow from '../components/home/QuestRow';
import StreakCard from '../components/home/StreakCard';
import { LIFT, RISE, Rise, useCountUp, useEntrance } from '../components/home/motion';
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
 * The sky is a Skia canvas, and the gem pill's glass is drawn in it rather
 * than over it: Figma's Glass is a lens, and a lens can only bend what its own
 * canvas has painted. See `Sky`.
 */

const GUTTER = layout.homeGutter;

/** The pill's corner radius, off the inspector. Past half its height, so it capsules. */
const PILL_RADIUS = 43;
/** From the pill's right edge to the screen's: the avatar, its gap, the gutter. */
const PILL_RIGHT = GUTTER + 16 + 40;
/** The greeting row is 42 tall and the pill is centred in it. */
const GREETING_ROW = 42;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

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

  /**
   * Where the pill is, so the sky can draw its glass there.
   *
   * The pill hugs its count, so its width is measured; everything else about
   * its position is the frame's own geometry. It rides the scroll and the
   * greeting row's entrance, both of which the sky follows on the UI thread.
   */
  const [pillSize, setPillSize] = useState({ w: 0, h: 0 });
  const pillEnter = useEntrance(60, RISE);
  const lens = useMemo(
    () => ({
      x: width - PILL_RIGHT - pillSize.w,
      y: insets.top + 11 + (GREETING_ROW - pillSize.h) / 2,
      w: pillSize.w,
      h: pillSize.h,
    }),
    [width, insets.top, pillSize],
  );

  return (
    <View style={styles.root}>
      <Sky scrollY={scrollY} lens={lens} enter={pillEnter} />

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
            <Glass style={styles.gemPill} radius={PILL_RADIUS} onSize={setPillSize}>
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
 * The sky behind it all, and the glass in front of it.
 *
 * The frame lays a wide cloud plate off the right edge and drops two soft
 * ellipses on top — one at (219, -67), one at (-94, 732). Those ellipses are
 * blurred cloud in the render rather than hard circles, so the same plates the
 * Skill Path backdrop uses stand in for them: they are already the right
 * softness, and they keep the two screens' skies identical.
 *
 * They travel at two rates against the scroll and drift on long loops of their
 * own, which is what stops the sky reading as wallpaper — and it is the motion
 * the glass needs to have anything to bend.
 *
 * It is a Skia canvas because of the gem pill. Figma's Glass is a lens: near
 * the edge it samples the backdrop from displaced coordinates, and that bent
 * band is the whole effect. The lens is a paint shader, and a paint shader
 * cannot read the canvas, so it is handed the sky instead — the same gradient,
 * and frosted copies of the same plates at the same places — and painted into
 * the pill's frame. The pill itself, up in the scroll view, is just the gem
 * and the count on nothing. The two stay aligned because both follow the same
 * scroll offset on the UI thread.
 */

const GLASS = Skia.RuntimeEffect.Make(GLASS_SKSL);

/** The two plates: their boxes (fitted with `contain`), opacity, and motion. */
const CLOUD_MAIN = { y: 30, w: 360, h: 240, opacity: 0.95, drift: 10, rate: 0.14 };
const CLOUD_LEFT = { x: -130, y: 330, w: 300, h: 200, opacity: 0.8, drift: 14, rate: 0.3 };

type Frame = { x: number; y: number; w: number; h: number };

function Sky({
  scrollY,
  lens,
  enter,
}: {
  scrollY: SharedValue<number>;
  /** The pill's frame in the scroll content, at rest. */
  lens: Frame;
  /** The greeting row's entrance, 0-1, so the glass arrives with the pill. */
  enter: SharedValue<number>;
}) {
  const { width, height } = useWindowDimensions();
  const cloudMain = useImage(require('../../assets/clouds/cloud-main.png'));
  const cloudLeft = useImage(require('../../assets/clouds/cloud-3.png'));
  const frostMain = useImage(require('../../assets/clouds/cloud-main-frost.png'));
  const frostLeft = useImage(require('../../assets/clouds/cloud-3-frost.png'));

  const driftA = useDrift(13000);
  const driftB = useDrift(17000);
  // Right -120 puts the box's right edge 120 past the screen's.
  const mainX = width + 120 - CLOUD_MAIN.w;

  // Where each plate is right now — drawn from these, and read by the lens
  // from the same, so the glass bends the cloud that is actually behind it.
  const farRect = useDerivedValue(
    () =>
      rect(
        mainX + (driftA.value - 0.5) * 2 * CLOUD_MAIN.drift,
        CLOUD_MAIN.y - scrollY.value * CLOUD_MAIN.rate,
        CLOUD_MAIN.w,
        CLOUD_MAIN.h,
      ),
    [mainX],
  );
  const nearRect = useDerivedValue(() =>
    rect(
      CLOUD_LEFT.x + (driftB.value - 0.5) * 2 * CLOUD_LEFT.drift,
      CLOUD_LEFT.y - scrollY.value * CLOUD_LEFT.rate,
      CLOUD_LEFT.w,
      CLOUD_LEFT.h,
    ),
  );

  // The pill's frame right now: its resting place, less the scroll, plus the
  // lift the greeting row is still arriving with.
  const clip = useDerivedValue(() => {
    const y = lens.y - scrollY.value + (1 - enter.value) * LIFT;
    return rrect(rect(lens.x, y, lens.w, lens.h), PILL_RADIUS, PILL_RADIUS);
  }, [lens]);

  const uniforms = useDerivedValue(() => {
    const y = lens.y - scrollY.value + (1 - enter.value) * LIFT;
    return {
      alphaA: CLOUD_MAIN.opacity,
      alphaB: CLOUD_LEFT.opacity,
      origin: [lens.x, y],
      size: [lens.w, lens.h],
      radius: PILL_RADIUS,
      refraction: FIGMA_GLASS.refraction,
      depth: FIGMA_GLASS.depth,
      splay: FIGMA_GLASS.splay,
      dispersion: FIGMA_GLASS.dispersion,
      edge: FIGMA_GLASS.edge,
      light: FIGMA_GLASS.light,
      lightAmt: FIGMA_GLASS.lightAmt,
      fill: FIGMA_GLASS.fill,
      amount: enter.value,
    };
  }, [lens]);

  const gradient = {
    start: vec(0, 0),
    end: vec(0, height * 0.55),
    colors: [colors.skyTop, colors.sky],
  };

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}>
        <SkGradient {...gradient} />
      </Rect>
      <SkImage image={cloudMain} rect={farRect} fit="contain" opacity={CLOUD_MAIN.opacity} />
      <SkImage image={cloudLeft} rect={nearRect} fit="contain" opacity={CLOUD_LEFT.opacity} />

      {/* The pill's glass: the sky as the lens sees it, bent into its frame.
          Nothing is drawn until the pill has reported its size and both
          frosted plates are in, since the shader needs all three inputs. */}
      {GLASS && frostMain && frostLeft && lens.w > 0 ? (
        <Group clip={clip}>
          <Fill>
            <Shader source={GLASS} uniforms={uniforms}>
              <SkGradient {...gradient} />
              <ImageShader image={frostMain} rect={farRect} fit="contain" tx="decal" ty="decal" />
              <ImageShader image={frostLeft} rect={nearRect} fit="contain" tx="decal" ty="decal" />
            </Shader>
          </Fill>
        </Group>
      ) : null}
    </Canvas>
  );
}

/** A slow 0-1-0 loop, so no two clouds line up the same way twice. */
function useDrift(duration: number) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [duration, t]);
  return t;
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
