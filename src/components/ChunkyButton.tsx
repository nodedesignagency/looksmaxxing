import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { radii, springs, type } from '../theme/tokens';

/**
 * A button built the same way the lesson nodes are: a face sitting above a
 * darker plate, where pressing settles the face down onto it. The nodes offset
 * by 2px; a control this size wants more, so it uses 4.
 */

const DROP = 4;

type Props = {
  label: string;
  face: string;
  edge: string;
  textColor: string;
  onPress: () => void;
  disabled?: boolean;
  /** 0-1 sweep across the face, for the running state. */
  progress?: Animated.SharedValue<number>;
};

export default function ChunkyButton({
  label,
  face,
  edge,
  textColor,
  onPress,
  disabled = false,
  progress,
}: Props) {
  const press = useSharedValue(0);

  const tap = React.useMemo(
    () =>
      Gesture.Tap()
        .enabled(!disabled)
        .maxDuration(10_000)
        .onBegin(() => {
          press.value = withSpring(1, springs.press);
        })
        .onFinalize(() => {
          press.value = withSpring(0, springs.press);
        })
        .onEnd(() => {
          runOnJS(onPress)();
        }),
    [disabled, onPress, press],
  );

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: press.value * DROP }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress ? progress.value : 0 }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <View style={styles.wrap}>
        <View style={[styles.edge, { backgroundColor: edge }]} />
        <Animated.View style={[styles.face, { backgroundColor: face }, faceStyle]}>
          {progress && (
            <Animated.View style={[styles.fill, fillStyle]} pointerEvents="none" />
          )}
          <Text style={[type.button, { color: textColor }]}>{label.toUpperCase()}</Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 54 + DROP, justifyContent: 'flex-start' },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: DROP,
    height: 54,
    borderRadius: radii.card,
  },
  face: {
    height: 54,
    borderRadius: radii.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    transformOrigin: 'left',
  },
});
