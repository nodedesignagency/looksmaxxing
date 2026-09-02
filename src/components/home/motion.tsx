import React from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * The screen's shared entrance, and the counters that run with it.
 *
 * One rule for the whole screen: everything fades up and lifts eight points, on
 * a 70ms stagger down the page, and nothing scales. The Skill Path nodes learnt
 * that the hard way — scaling a band re-rasterises the text inside it on every
 * frame, and Home has far more text than that screen does.
 */

/** How long each band takes, and how far apart they start. */
const RISE = 380;
const STAGGER = 70;
const LIFT = 8;

/**
 * A band of the screen, arriving in its turn.
 *
 * `index` is its place down the page, not its place in the tree, so the order
 * reads top to bottom however the components happen to be nested.
 */
export function Rise({
  index,
  style,
  children,
}: {
  index: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const enter = useSharedValue(0);

  React.useEffect(() => {
    enter.value = withDelay(
      60 + index * STAGGER,
      withTiming(1, { duration: RISE, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, enter]);

  const animated = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * LIFT }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}

/**
 * A number that counts to its value instead of appearing at it.
 *
 * Driven from JS rather than a worklet, deliberately. Reanimated cannot write
 * text from the UI thread without routing through an `AnimatedProps` TextInput,
 * which brings its own padding and alignment quirks on both platforms, and the
 * cost here is a few dozen re-renders of one `<Text>` once per mount. That is
 * cheaper than the workaround and much easier to read.
 *
 * It eases out, so the last few digits crawl — which is the part that reads as
 * a total settling rather than a number spinning.
 */
export function useCountUp(target: number, duration = 900, delay = 260) {
  const [shown, setShown] = React.useState(0);

  React.useEffect(() => {
    let raf = 0;
    let start = 0;
    let cancelled = false;

    const tick = (now: number) => {
      if (cancelled) return;
      if (!start) start = now;
      const t = Math.min(1, (now - start) / duration);
      // Cubic ease-out, matching the entrance the counters run alongside.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    const timer = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay]);

  return shown;
}

/** Drives a shared value 0 -> 1 once, after a delay. Used by the set pieces. */
export function useEntrance(delay: number, duration = 620): SharedValue<number> {
  const value = useSharedValue(0);
  React.useEffect(() => {
    value.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, duration, value]);
  return value;
}
