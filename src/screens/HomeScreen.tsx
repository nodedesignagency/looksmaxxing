import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import LevelCard from '../components/home/LevelCard';
import QuestRow from '../components/home/QuestRow';
import StreakCard from '../components/home/StreakCard';
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
 * Colours are read off the rendered frame rather than pulled from it. The Figma
 * MCP connection is capped on this account — `get_design_context`,
 * `get_variable_defs`, `get_screenshot` and `download_assets` all refuse — and
 * the public embed is blocked by this session's egress policy, so one
 * `get_metadata` call is the whole of what came back. It carries every position
 * and size in the frame, which is why the geometry here is exact and the
 * palette is a reading.
 */

const GUTTER = layout.homeGutter;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [done, setDone] = useState<string[]>(SEED_DONE);

  const toggle = useCallback((id: string) => {
    setDone((prev) => (prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]));
  }, []);

  /**
   * "3/5 completed".
   *
   * Counted, not transcribed. The frame's label reads 3/5 while it draws checks
   * on two of the five rows — a comp's placeholder rather than a spec — and a
   * number that disagrees with the marks beside it is worse than one that moves.
   */
  const completed = useMemo(
    () => QUESTS.filter((q) => done.includes(q.id)).length,
    [done],
  );

  return (
    <View style={styles.root}>
      <Sky />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 11 }}
      >
        {/* "Frame 2147235537" — 350x42. */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={[type.greeting, styles.greeting]}>Hi, {PLAYER.name}</Text>
            <Text style={[type.welcome, styles.welcome]}>Welcome Back</Text>
          </View>

          <View style={styles.account}>
            {/* "Frame 2147235516" — a 74x41 pill: gem at 10, count at 34. */}
            <View style={styles.gemPill}>
              <GemIcon size={20} />
              <Text style={[type.gemCount, styles.gemCount]}>{GEMS}</Text>
            </View>
            <View style={styles.avatar}>
              <AvatarGlyph size={26} color={colors.nodePlate} />
            </View>
          </View>
        </View>

        <View style={styles.streak}>
          <StreakCard days={STREAK.days} week={STREAK.week} />
        </View>

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
            {
              paddingBottom:
                layout.tabBarHeight + layout.tabBarBottomGap + insets.bottom + 24,
            },
          ]}
        >
          <LevelCard
            level={LEVEL.level}
            xp={LEVEL.xp}
            xpTo={LEVEL.xpTo}
            steps={LEVEL.steps}
            reached={LEVEL.reached}
          />

          {/* "Frame 2147236454" — 350 wide, its rows inset a further 4. */}
          <View style={styles.quests}>
            <View style={styles.questHead}>
              <View style={styles.questHeadText}>
                <Text style={[type.questHeading, styles.questHeading]}>Today’s Quest</Text>
                <Text style={[type.questSub, styles.questSubhead]}>Quests resets at midnight</Text>
              </View>

              {/* "Frame 2147236451" — a 105x26 pill around an 18x18 ring. */}
              <View style={styles.countPill}>
                <Ring done={completed} total={QUESTS.length} />
                <Text style={[type.questCount, styles.countText]}>
                  {completed}/{QUESTS.length} completed
                </Text>
              </View>
            </View>

            {QUESTS.map((quest) => (
              <QuestRow
                key={quest.id}
                quest={quest}
                done={done.includes(quest.id)}
                onToggle={toggle}
              />
            ))}
          </View>
        </View>
      </ScrollView>
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
 */
function Sky() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.skyTop, colors.sky]}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />
      <Image
        source={require('../../assets/clouds/cloud-main.png')}
        style={styles.cloudTop}
        resizeMode="contain"
      />
      <Image
        source={require('../../assets/clouds/cloud-3.png')}
        style={styles.cloudLeft}
        resizeMode="contain"
      />
    </View>
  );
}

/** The 18x18 "Circular Progress Bar [1.0]" in the quest header. */
function Ring({ done, total }: { done: number; total: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const swept = total > 0 ? c * (done / total) : 0;
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Circle cx={9} cy={9} r={r} stroke={colors.questPending} strokeWidth={2.5} fill="none" />
      <Circle
        cx={9}
        cy={9}
        r={r}
        stroke={colors.questDone}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${swept} ${c}`}
        // Start the sweep at twelve o'clock rather than three.
        transform="rotate(-90 9 9)"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sky },

  cloudTop: { position: 'absolute', top: 40, right: -110, width: 320, height: 213, opacity: 0.9 },
  cloudLeft: { position: 'absolute', top: 380, left: -120, width: 260, height: 174, opacity: 0.75 },

  greetingRow: {
    marginHorizontal: GUTTER,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: { color: colors.greeting },
  welcome: { color: colors.heading, marginTop: 2 },

  account: { flexDirection: 'row', alignItems: 'center' },
  gemPill: {
    height: 41,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.glassEdge,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gemCount: { marginLeft: 4, color: colors.heading },
  avatar: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  streak: { marginHorizontal: GUTTER, marginTop: 16 },

  sheet: {
    marginTop: 16,
    paddingTop: 20,
    paddingHorizontal: GUTTER,
    borderTopLeftRadius: radii.homeSheet,
    borderTopRightRadius: radii.homeSheet,
    backgroundColor: colors.sheet,
  },

  // The quest block sits 4 in from the level card above it, per the frame.
  quests: { marginTop: 16, marginHorizontal: 4 },
  questHead: {
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  questHeadText: { flex: 1 },
  questHeading: { color: colors.heading },
  questSubhead: { color: colors.questBody, marginTop: 4 },
  countPill: {
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.questPending,
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: { marginLeft: 6, color: colors.questTitle },
});
