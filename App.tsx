// Subpath imports so Metro bundles only the four faces used, not all 18.
import DMSans_400Regular from '@expo-google-fonts/dm-sans/400Regular/DMSans_400Regular.ttf';
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
import HomeScreen from './src/screens/HomeScreen';
import { warmPathImages } from './src/lib/preload';
import SkillPathScreen from './src/screens/SkillPathScreen';
import { useProgress } from './src/state/useProgress';
import { colors } from './src/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function App() {
  const [fontsLoaded] = useFonts({
    // The Home frame sets "CURRENT STREAK" in DM Sans; everything else is Geist.
    DMSans_400Regular,
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
  // Two of the four tabs lead somewhere. Shop and Progress are still part of the
  // design rather than the app, so they keep their bounce and nothing else.
  const [tab, setTab] = useState<TabKey>('home');
  const [sheetOpen, setSheetOpen] = useState(false);

  /**
   * Which screens have been opened. A screen is built the first time it is
   * asked for and kept from then on.
   *
   * Not both up front, for two reasons. Skill Path lays out a five thousand
   * point road across five SVG bands and a windowed node list, and none of that
   * is worth doing at launch for a screen behind a tab you may not press. And
   * it opens itself on the lesson you are up to, which it does by scrolling on
   * its first layout — laid out while hidden, that scroll goes nowhere and the
   * screen opens at the top of the road instead.
   */
  const [seen, setSeen] = useState<TabKey[]>(['home']);

  /**
   * Skill Path's images, pulled in behind Home.
   *
   * The screen stays lazy for the reasons above, but nothing fetches a bundled
   * image until something renders it — so pressing Path was also the moment
   * three cloud plates and two glyphs started loading, and they arrived one
   * after another on a screen that was already drawn. Warming them here costs
   * nothing anyone sees.
   */
  React.useEffect(warmPathImages, []);
  const show = useCallback((key: TabKey) => {
    setSeen((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setTab(key);
  }, []);
  const { ready, completedByPath, completeLesson } = useProgress();

  const onComplete = useCallback(
    (pathId: string, lesson: Lesson) => completeLesson(pathId, lesson.id, lesson.xp),
    [completeLesson],
  );

  if (!ready) return <Splash />;

  return (
    <View style={styles.root}>
      {/*
        Once built, a screen stays: hidden with `display: none` rather than
        unmounted, so coming back finds the scroll position and the progress it
        was left with rather than the top of it.
      */}
      <View style={[styles.screen, tab !== 'home' && styles.away]}>
        <HomeScreen />
      </View>
      {seen.includes('path') && (
        <View style={[styles.screen, tab !== 'path' && styles.away]}>
          <SkillPathScreen
            completedByPath={completedByPath}
            onComplete={onComplete}
            onSheetOpenChange={setSheetOpen}
          />
        </View>
      )}

      <TabBar
        active={tab}
        onChange={show}
        bottomInset={insets.bottom}
        hidden={sheetOpen}
        available={['home', 'path']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sky },
  // Only ever one of these is displayed, so flex gives it the whole shell.
  screen: { flex: 1 },
  away: { display: 'none' },
});
