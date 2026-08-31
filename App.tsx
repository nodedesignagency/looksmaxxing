// Subpath imports so Metro bundles only these three faces, not all 16 weights.
import Nunito_600SemiBold from '@expo-google-fonts/nunito/600SemiBold/Nunito_600SemiBold.ttf';
import Nunito_700Bold from '@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf';
import Nunito_800ExtraBold from '@expo-google-fonts/nunito/800ExtraBold/Nunito_800ExtraBold.ttf';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
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
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {fontsLoaded ? <Shell /> : <Splash />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** The sky, with nothing on it — so the first paint is never a white flash. */
function Splash() {
  return (
    <LinearGradient
      colors={[colors.skyTop, colors.skyMid, colors.skyLow, colors.skyBottom]}
      locations={[0, 0.34, 0.68, 1]}
      style={styles.root}
    />
  );
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
  root: { flex: 1, backgroundColor: colors.skyMid },
});
