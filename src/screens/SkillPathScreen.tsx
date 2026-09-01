import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
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

export default function SkillPathScreen({
  completedByPath,
  onComplete,
  onSheetOpenChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [activeId, setActiveId] = useState(PATHS[0].id);
  const [selected, setSelected] = useState<{ lesson: Lesson; status: LessonStatus } | null>(null);
  const [burst, setBurst] = useState(0);
  const [burstAt, setBurstAt] = useState<{ x: number; y: number } | null>(null);

  const scrollY = useSharedValue(0);
  const scroller = useAnimatedRef<Animated.ScrollView>();

  const path = useMemo(() => PATHS.find((p) => p.id === activeId) ?? PATHS[0], [activeId]);
  const completed = completedByPath[path.id] ?? [];

  // The frame is 390 wide; scale x so the layout keeps its proportions on wider
  // handsets rather than hugging the left edge.
  const scale = width / DESIGN_WIDTH;
  const firstNodeY = headerMetrics(insets.top).firstNodeY;

  const nodes = useMemo(
    () =>
      path.lessons.map((lesson, i) => ({
        lesson,
        x: layout.nodeColumns[i % layout.nodeColumns.length] * scale,
        y: firstNodeY + i * layout.nodeSpacing,
      })),
    [path, scale, firstNodeY],
  );

  /** Last node's bottom edge, plus just enough to clear the floating tab bar. */
  const contentHeight =
    firstNodeY +
    Math.max(0, path.lessons.length - 1) * layout.nodeSpacing +
    layout.nodeSize +
    layout.tabBarHeight +
    layout.tabBarBottomGap +
    insets.bottom +
    24;

  /**
   * The road switches column midway between each pair of nodes, which is what
   * puts every node in the column the road has just left.
   */
  const road = useMemo(() => {
    const centres = nodes.map((n) => n.y + layout.nodeFace / 2);
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
  }, [nodes, scale, contentHeight]);

  const statuses = useMemo(
    () => statusesFor(path.lessons.map((l) => l.id), completed),
    [path, completed],
  );

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const handleNodePress = useCallback((lesson: Lesson, status: LessonStatus) => {
    // Locked nodes answer with the shake inside SkillNode; nothing opens.
    if (status === 'locked') return;
    setSelected({ lesson, status });
  }, []);

  const handleComplete = useCallback(
    (lesson: Lesson) => {
      const i = path.lessons.findIndex((l) => l.id === lesson.id);
      const node = nodes[i];
      if (node) {
        setBurstAt({
          x: node.x + layout.nodeFace / 2,
          y: node.y + layout.nodeFace / 2 - scrollY.value,
        });
        setBurst((n) => n + 1);
      }
      onComplete(path.id, lesson);
      // The sheet stays open on its result card; CONTINUE dismisses it.
    },
    [nodes, onComplete, path, scrollY],
  );

  const handleCategory = useCallback(
    (id: string) => {
      setActiveId(id);
      setSelected(null);
      scroller.current?.scrollTo({ y: 0, animated: true });
    },
    [scroller],
  );

  React.useEffect(() => {
    onSheetOpenChange(selected !== null);
  }, [selected, onSheetOpenChange]);

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
        <SkillRoad width={width} height={contentHeight} road={road} drawKey={path.id} />

        {nodes.map((node, i) => (
          <SkillNode
            key={node.lesson.id}
            lesson={node.lesson}
            status={statuses[i]}
            index={i}
            x={node.x}
            y={node.y}
            onPress={handleNodePress}
            drawKey={path.id}
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
        onComplete={handleComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
