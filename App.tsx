import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import TabBar, { type TabKey } from './src/components/TabBar';
import type { Lesson } from './src/data/paths';
import SkillPathScreen from './src/screens/SkillPathScreen';
import { useProgress } from './src/state/useProgress';
import { colors } from './src/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Dark glyphs, as the frame's status bar shows against the light sky. */}
        <StatusBar style="dark" />
        <Shell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** The sky, with nothing on it — so the first paint is never a white flash. */
function Splash() {
  return <View style={styles.root} />;
}

function Shell() {
  const insets = useSafeAreaInsets();
  // The Figma frame ships one screen. The tab bar is part of that design, so it
  // stays and stays animated, but Path is the only destination that exists.
  const [tab, setTab] = useState<TabKey>('path');
  const [sheetOpen, setSheetOpen] = useState(false);
  const { ready, completedByPath, completeLesson } = useProgress();

  const onComplete = useCallback(
    (pathId: string, lesson: Lesson) => completeLesson(pathId, lesson.id, lesson.xp),
    [completeLesson],
  );

  if (!ready) return <Splash />;

  return (
    <View style={styles.root}>
      <SkillPathScreen
        completedByPath={completedByPath}
        onComplete={onComplete}
        onSheetOpenChange={setSheetOpen}
      />

      <TabBar
        active={tab}
        onChange={setTab}
        bottomInset={insets.bottom}
        hidden={sheetOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sky },
});
