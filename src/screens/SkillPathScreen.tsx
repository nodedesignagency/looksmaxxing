import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Backdrop from '../components/Backdrop';
import Celebration from '../components/Celebration';
import Header from '../components/Header';
import LessonSheet from '../components/LessonSheet';
import SkillNode from '../components/SkillNode';
import SkillRoad from '../components/SkillRoad';
import LessonPlayer from './LessonPlayer';
import { PATHS } from '../data/paths';
import type { Lesson } from '../data/paths';
import { buildRoad } from '../lib/road';
import { statusesFor, type LessonStatus } from '../state/useProgress';
import { DESIGN_WIDTH, headerMetrics, layout, road as roadTokens } from '../theme/tokens';

type Props = {
  completedByPath: Record<string, string[]>;
  onComplete: (pathId: string, lesson: Lesson) => void;
  /** Lets the shell move the floating tab bar out from under the sheet. */
  onSheetOpenChange: (open: boolean) => void;
};

/** Breathing room where one category's road hands over to the next. */
const SECTION_GAP = 70;

/** Scroll distance per mount band. */
const BAND = 500;

/** How far beyond the viewport a node stays mounted. */
const MOUNT_MARGIN = 700;

type Row = {
  pathId: string;
  lesson: Lesson;
  status: LessonStatus;
  x: number;
  y: number;
};

export default function SkillPathScreen({
  completedByPath,
  onComplete,
  onSheetOpenChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [activeId, setActiveId] = useState(PATHS[0].id);
  const [selected, setSelected] = useState<{ lesson: Lesson; status: LessonStatus } | null>(null);
  const [burst, setBurst] = useState(0);
  const [burstAt, setBurstAt] = useState<{ x: number; y: number } | null>(null);
  const [playing, setPlaying] = useState<Lesson | null>(null);

  const scrollY = useSharedValue(0);
  const section = useSharedValue(0);
  const scroller = useAnimatedRef<Animated.ScrollView>();
  const lastBand = useSharedValue(0);

  /**
   * Which 500px band of the scroll we are in. Every node is an absolutely
   * positioned view with its own gesture handler and two SVGs, and all four
   * categories together come to well over thirty of them — far too many to keep
   * mounted at once. Only nodes near this band are rendered. The band is coarse
   * on purpose: it re-renders roughly once per screen of travel rather than per
   * frame.
   */
  const [band, setBand] = useState(0);

  // The frame is 390 wide; scale x so the layout keeps its proportions on wider
  // handsets rather than hugging the left edge.
  const scale = width / DESIGN_WIDTH;
  const { firstNodeY, scrimHeight } = headerMetrics(insets.top);

  /**
   * Every category laid end to end on one road, rather than a path per chip.
   * Scrolling off the bottom of one carries straight into the next, and the
   * chip row follows where you are instead of choosing what you see.
   */
  const { rows, starts, ids, contentHeight } = useMemo(() => {
    const out: Row[] = [];
    const starts: number[] = [];
    const ids: string[] = [];
    let y = firstNodeY;
    let n = 0;

    for (const path of PATHS) {
      const statuses = statusesFor(
        path.lessons.map((l) => l.id),
        completedByPath[path.id] ?? [],
      );
      starts.push(y);
      ids.push(path.id);
      path.lessons.forEach((lesson, i) => {
        out.push({
          pathId: path.id,
          lesson,
          status: statuses[i],
          x: layout.nodeColumns[n % layout.nodeColumns.length] * scale,
          y,
        });
        y += layout.nodeSpacing;
        n += 1;
      });
      y += SECTION_GAP;
    }

    const height =
      y -
      SECTION_GAP -
      layout.nodeSpacing +
      layout.nodeSize +
      layout.tabBarHeight +
      layout.tabBarBottomGap +
      insets.bottom +
      24;

    return { rows: out, starts, ids, contentHeight: height };
  }, [completedByPath, firstNodeY, scale, insets.bottom]);

  /**
   * The road switches column midway between each pair of nodes, which is what
   * puts every node in the column the road has just left.
   */
  const road = useMemo(() => {
    const centres = rows.map((r) => r.y + layout.nodeFace / 2);
    const crossings = centres.slice(0, -1).map((c, i) => (c + centres[i + 1]) / 2);
    return buildRoad({
      leftX: roadTokens.leftX * scale,
      rightX: roadTokens.rightX * scale,
      corner: roadTokens.corner,
      crossings,
      top: -80,
      bottom: contentHeight + 120,
      // Node 1 sits in the left column, so the road enters on the right.
      startRight: true,
    });
  }, [rows, scale, contentHeight]);

  /** Where the chip row should read from: just under the header. */
  const probe = scrimHeight + 40;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;

    const at = e.contentOffset.y + probe;
    let i = 0;
    for (let k = 0; k < starts.length; k++) {
      if (at >= starts[k]) i = k;
    }
    if (i !== section.value) {
      section.value = i;
      runOnJS(setActiveId)(ids[i]);
    }

    const b = Math.floor(e.contentOffset.y / BAND);
    if (b !== lastBand.value) {
      lastBand.value = b;
      runOnJS(setBand)(b);
    }
  });

  /** Nodes within a screen either side of the band stay mounted. */
  const visible = useMemo(() => {
    const from = band * BAND - MOUNT_MARGIN;
    const to = band * BAND + height + MOUNT_MARGIN;
    return rows.filter((r) => r.y + layout.nodeSize > from && r.y < to);
  }, [rows, band, height]);

  const handleNodePress = useCallback((lesson: Lesson, status: LessonStatus) => {
    // Locked nodes answer with the shake inside SkillNode; nothing opens.
    if (status === 'locked') return;
    setSelected({ lesson, status });
  }, []);

  /** Start pressed: hand off to the interlude and get the sheet out of the way. */
  const handleStart = useCallback((lesson: Lesson) => {
    setSelected(null);
    setPlaying(lesson);
  }, []);

  /** Interlude finished: bank the XP, burst confetti, bring back the result. */
  const handlePlayerDone = useCallback(() => {
    const lesson = playing;
    setPlaying(null);
    if (!lesson) return;

    const row = rows.find((r) => r.lesson.id === lesson.id);
    if (row) {
      setBurstAt({
        x: row.x + layout.nodeFace / 2,
        y: row.y + layout.nodeFace / 2 - scrollY.value,
      });
      setBurst((n) => n + 1);
      onComplete(row.pathId, lesson);
    }
    setSelected({ lesson, status: 'done' });
  }, [playing, rows, onComplete, scrollY]);

  /** Chips jump to a category rather than swapping the road out. */
  const handleCategory = useCallback(
    (id: string) => {
      const i = ids.indexOf(id);
      if (i < 0) return;
      setSelected(null);
      scroller.current?.scrollTo({ y: Math.max(0, starts[i] - probe + 60), animated: true });
    },
    [ids, starts, probe, scroller],
  );

  React.useEffect(() => {
    onSheetOpenChange(selected !== null || playing !== null);
  }, [selected, playing, onSheetOpenChange]);

  return (
    <View style={styles.root}>
      <Backdrop scrollY={scrollY} contentHeight={contentHeight} />

      <Animated.ScrollView
        ref={scroller}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: contentHeight }}
      >
        <SkillRoad width={width} height={contentHeight} road={road} drawKey="all" />

        {visible.map((row, i) => (
          <SkillNode
            key={row.lesson.id}
            lesson={row.lesson}
            status={row.status}
            index={i}
            x={row.x}
            y={row.y}
            onPress={handleNodePress}
            drawKey="all"
          />
        ))}
      </Animated.ScrollView>

      <Header
        paths={PATHS}
        activeId={activeId}
        onChange={handleCategory}
        topInset={insets.top}
      />

      <Celebration token={burst} origin={burstAt} />

      <LessonSheet
        lesson={selected?.lesson ?? null}
        status={selected?.status ?? 'current'}
        onClose={() => setSelected(null)}
        onStart={handleStart}
      />

      <LessonPlayer visible={playing !== null} onDone={handlePlayerDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
