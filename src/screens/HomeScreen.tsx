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
import QuestDust, { dustImage, type Dust } from '../components/home/QuestDust';
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

  /** Struck through — including the one currently blowing away. */
  const [done, setDone] = useState<string[]>(SEED_DONE);
  /** Gone from the list for good. */
  const [cleared, setCleared] = useState<string[]>([]);
  /** The row in the air, and the snapshot it is made of. */
  const [dust, setDust] = useState<Dust | null>(null);
  const [clearing, setClearing] = useState<string | null>(null);
  const [burst, setBurst] = useState(0);
  const [burstAt, setBurstAt] = useState<{ x: number; y: number } | null>(null);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

/**
   * Striking a quest through: the mark stamps in and confetti comes off it.
   */
  const tick = useCallback((id: string, at: { x: number; y: number }) => {
    setDone((prev) => {
      if (prev.includes(id)) return prev;
      setBurstAt(at);
      setBurst((n) => n + 1);
      return [...prev, id];
    });
  }, []);

  /**
   * The row has taken its own picture. Put it in the air and let its slot
   * close underneath.
   *
   * A row that could not be snapshotted skips straight to gone rather than
   * hanging about: the dust is the flourish, not the mechanism.
   */
  const startDust = useCallback(
    (
      id: string,
      base64: string | null,
      frame: { x: number; y: number; width: number; height: number },
    ) => {
      const image = base64 ? dustImage(base64) : null;
      setClearing(id);
      if (!image) {
        setCleared((prev) => (prev.includes(id) ? prev : [...prev, id]));
        return;
      }
      setDust({ id, image, frame });
    },
    [],
  );

  /**
   * The dust has settled. The specks stop being drawn, but the row keeps its
   * place: the gap it left stays open for a beat, and the row itself only
   * leaves the list once that gap has closed.
   */
  const settle = useCallback(() => setDust(null), []);

  /** The gap has closed. */
  const close = useCallback((id: string) => {
    setCleared((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const visible = useMemo(() => QUESTS.filter((q) => !cleared.includes(q.id)), [cleared]);

  /**
   * "3/5 completed".
   *
   * Counted, not transcribed: the frame's label is a comp's placeholder. It
   * counts what has been struck through rather than what is still on screen,
   * since a cleared quest leaves the list and the tally has to keep it.
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

              {/* "Frame 2147236451" — a 105x26 pill around an 18x18 ring, with
                  no fill of its own: the sheet shows through, and a 1px inside
                  hairline is the only thing that draws it. */}
              <View style={styles.countPill}>
                <View style={styles.countPillRing} pointerEvents="none" />
                <Ring done={completed} total={QUESTS.length} />
                <Text style={[type.questCount, styles.countText]}>
                  {completed}/{QUESTS.length} completed
                </Text>
              </View>
            </Rise>

            {visible.map((quest, i) => (
              <Rise key={quest.id} index={4 + i}>
                <QuestRow
                  quest={quest}
                  done={done.includes(quest.id)}
                  clearing={clearing === quest.id}
                  onTick={tick}
                  onDust={startDust}
                  onClosed={close}
                />
              </Rise>
            ))}

            {/* The list empties as it is worked through, and an empty card with
                a heading on it reads as broken rather than finished. */}
            {visible.length === 0 && (
              <Rise index={4}>
                <Text style={[type.questSub, styles.allDone]}>
                  All {QUESTS.length} done. Come back tomorrow.
                </Text>
              </Rise>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      <Celebration token={burst} origin={burstAt} />
      <QuestDust dust={dust} onSettled={settle} />
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

/**
 * The plate: its box (fitted with `contain`), opacity, and motion.
 *
 * Only the top of this screen is sky. The streak card covers 128-294 bar a 20
 * gutter each side, and the sheet covers everything from 310 down, so a plate
 * is seen through four gaps: the band above the card, the two gutters, the 16
 * between card and sheet, and the sheet's own 32 corners.
 *
 * It is placed to cross that lower run rather than sit above it, so it reads
 * as one cloud passing behind the cards — caught in the gutters, the gap and
 * the corners at once.
 *
 * There is one plate rather than two. A second sat over the greeting row, and
 * it is what the gem pill's glass had to bend; without it the pill is a lens
 * on the gradient alone at rest, and picks the cloud up as the two scroll past
 * each other at different rates. The glass reads on plain sky, so the sky above
 * the greeting is left clear.
 */
const CLOUD_MAIN = { y: 168, w: 400, h: 260, opacity: 0.95, drift: 10, rate: 0.14 };

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
  const frostMain = useImage(require('../../assets/clouds/cloud-main-frost.png'));

  const driftA = useDrift(13000);
  // Centred, near enough: the band it crosses is the full width of the screen.
  const mainX = width + 30 - CLOUD_MAIN.w;

  // Where the plate is right now — drawn from this, and read by the lens from
  // the same, so the glass bends the cloud that is actually behind it.
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

      {/* The pill's glass: the sky as the lens sees it, bent into its frame.
          Nothing is drawn until the pill has reported its size and the frosted
          plate is in, since the shader needs both inputs. */}
      {GLASS && frostMain && lens.w > 0 ? (
        <Group clip={clip}>
          <Fill>
            <Shader source={GLASS} uniforms={uniforms}>
              <SkGradient {...gradient} />
              <ImageShader image={frostMain} rect={farRect} fit="contain" tx="decal" ty="decal" />
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
// The frame draws it as an 18x18 arc with an inner radius of 65.67%, so the
// ring runs from 5.91 out to 9 — a 3.09 band centred on 7.46. It was a 2.5
// stroke at 7, which is both thinner and smaller than the frame's.
const OUTER = 9;
const R = (OUTER + OUTER * 0.6567) / 2;
const WIDTH = OUTER - OUTER * 0.6567;
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
      <Circle cx={9} cy={9} r={R} stroke={colors.ringTrack} strokeWidth={WIDTH} fill="none" />
      <AnimatedCircle
        cx={9}
        cy={9}
        r={R}
        stroke={colors.questDone}
        strokeWidth={WIDTH}
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
  // 4 in from the ring's side, 8 from the label's: 4 + 18 + 6 + 69 + 8 = 105.
  countPill: {
    height: 26,
    paddingLeft: 4,
    paddingRight: 8,
    borderRadius: radii.countPill,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // An inset ring, not `borderWidth`: Figma's "Inside" stroke paints over the
  // frame without taking layout, where a border eats into the content box and
  // would leave the 18 ring 2 short of its 26.
  countPillRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radii.countPill,
    borderWidth: 1,
    borderColor: colors.countPillEdge,
  },
  countText: { marginLeft: 6, color: colors.questTitle },
  allDone: { color: colors.questBody, textAlign: 'center', paddingVertical: 22 },
});
