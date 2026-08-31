import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import SkillTrail from '../components/SkillTrail';
import { AVAILABLE_PATHS, PATHS } from '../data/paths';
import type { Lesson } from '../data/paths';
import { buildTrail } from '../lib/trail';
import { statusesFor, type LessonStatus } from '../state/useProgress';
import { DESIGN_WIDTH, headerMetrics, layout } from '../theme/tokens';

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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const path = useMemo(() => PATHS.find((p) => p.id === activeId) ?? PATHS[0], [activeId]);
  const completed = completedByPath[path.id] ?? [];

  // The Figma frame is 390 wide; scale the node columns so the zigzag keeps its
  // proportions on wider handsets instead of hugging the left edge.
  const scale = width / DESIGN_WIDTH;

  /** Top of the first 50x50 node frame — y=144 in the Figma's 59px-inset frame. */
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

  const contentHeight =
    firstNodeY +
    (path.lessons.length - 1) * layout.nodeSpacing +
    layout.nodeSize +
    layout.tabBarHeight +
    layout.tabBarBottomGap +
    insets.bottom +
    60;

  const trail = useMemo(
    () =>
      buildTrail(
        // Centre of the 48x48 face inside each 50x50 node frame.
        nodes.map((n) => ({ x: n.x + layout.nodeFace / 2, y: n.y + layout.nodeFace / 2 })),
        { leadIn: firstNodeY + 60, leadOut: 200 },
      ),
    [nodes, firstNodeY],
  );

  const statuses = useMemo(
    () => statusesFor(path.lessons.map((l) => l.id), completed),
    [path, completed],
  );

  const currentIndex = Math.max(0, statuses.indexOf('current'));
  const doneCount = statuses.filter((s) => s === 'done').length;

  // The coloured run of trail ends on the last node actually completed.
  const progressLength = doneCount > 0 ? trail.lengthAt[doneCount - 1] : 0;
  const currentLength = trail.lengthAt[currentIndex] ?? progressLength;

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
        // Node centre in screen space, so the confetti erupts from the button.
        setBurstAt({
          x: node.x + layout.nodeFace / 2,
          y: node.y + layout.nodeFace / 2 - scrollY.value,
        });
        setBurst((n) => n + 1);
      }
      onComplete(path.id, lesson);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      // Let the success land before the sheet gets out of the way.
      closeTimer.current = setTimeout(() => setSelected(null), 520);
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

  React.useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

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
        <SkillTrail
          width={width}
          height={contentHeight}
          trail={trail}
          progressLength={progressLength}
          startLength={trail.lengthAt[0] ?? 0}
          currentLength={currentLength}
          accent={path.accent}
          drawKey={path.id}
        />

        {nodes.map((node, i) => (
          <SkillNode
            key={node.lesson.id}
            lesson={node.lesson}
            status={statuses[i]}
            index={i}
            x={node.x}
            y={node.y}
            accent={path.accent}
            onPress={handleNodePress}
            drawKey={path.id}
          />
        ))}
      </Animated.ScrollView>

      <Header
        paths={PATHS}
        activeId={activeId}
        available={AVAILABLE_PATHS}
        onChange={handleCategory}
        scrollY={scrollY}
        topInset={insets.top}
      />

      <Celebration token={burst} origin={burstAt} accent={path.accent} />

      <LessonSheet
        lesson={selected?.lesson ?? null}
        status={selected?.status ?? 'open'}
        accent={path.accent}
        onClose={() => setSelected(null)}
        onComplete={handleComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
