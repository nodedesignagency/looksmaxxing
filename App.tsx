// Subpath imports so Metro bundles only the four faces used, not all 18.
import Geist_400Regular from '@expo-google-fonts/geist/400Regular/Geist_400Regular.ttf';
import Geist_500Medium from '@expo-google-fonts/geist/500Medium/Geist_500Medium.ttf';
import Geist_600SemiBold from '@expo-google-fonts/geist/600SemiBold/Geist_600SemiBold.ttf';
import Geist_700Bold from '@expo-google-fonts/geist/700Bold/Geist_700Bold.ttf';
import { useFonts } from 'expo-font';
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
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        {/* Dark glyphs, as the frame's status bar shows against the light sky. */}
        <StatusBar style="dark" />
        {/* Hold the sky until Geist is ready, so no frame renders in a fallback. */}
        {fontsLoaded ? <Shell /> : <Splash />}
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
