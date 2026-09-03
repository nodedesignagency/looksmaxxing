import {
  Canvas,
  ImageShader,
  Rect,
  Shader,
  Skia,
  rect,
  type SkImage,
} from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Easing,
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { DUST, DUST_SKSL } from './dustShader';

/**
 * The layer a struck-through quest blows away on.
 *
 * It is one canvas over the whole screen rather than one per row, and it draws
 * a snapshot of the row taken the moment its mark landed. Both of those are
 * deliberate. The specks fly a long way up and to the right — further than the
 * row is tall — so a canvas sized to the row would have to escape its own
 * bounds, which Android does not reliably allow. And the row itself has to be
 * free to collapse underneath while its dust hangs in the air; it cannot both
 * be the thing coming apart and the thing making room.
 *
 * The frame is in window coordinates, so it does not move with the list, and
 * the list holds still until the last speck has gone — see `QuestRow`. The two
 * are the same rule from either end: the dust and the gap closing are separate
 * beats, and overlapping them means neither is legible.
 *
 * The canvas is always mounted and simply draws nothing between flights. It is
 * not there to save a mount: a Skia canvas sizes its surface from its first
 * layout, and one mounted mid-animation has none yet — it paints once, into
 * nothing, and since the flight is driven by shared values rather than state
 * there is never a second render to correct it. The dust came out invisible
 * that way, with every value along the path correct.
 */

const EFFECT = Skia.RuntimeEffect.Make(DUST_SKSL);

export type Dust = {
  id: string;
  image: SkImage;
  /** The row's frame when it was snapshotted, in window coordinates. */
  frame: { x: number; y: number; width: number; height: number };
};

/**
 * Room around the row for the specks to fly into. They go up and to the right,
 * so only those two sides need much — and painting no more than this keeps the
 * shader off the rest of the screen.
 */
const AIR = { left: 14, top: 132, right: 112, bottom: 14 };

export default function QuestDust({
  dust,
  onSettled,
}: {
  dust: Dust | null;
  /** The last speck has gone. The row keeps its place; only the dust stops. */
  onSettled: () => void;
}) {
  const t = useSharedValue(0);

  React.useEffect(() => {
    if (!dust) return;
    t.value = 0;
    // Linear, deliberately. The front crosses the row at a constant rate, and
    // easing that is what would make it read as a snap rather than a drift.
    t.value = withTiming(1, { duration: DUST.duration, easing: Easing.linear }, (finished) => {
      'worklet';
      if (finished) runOnJS(onSettled)();
    });
  }, [dust, onSettled, t]);

  const frame = dust?.frame;
  const uniforms = useDerivedValue(
    () => ({
      origin: [frame?.x ?? 0, frame?.y ?? 0],
      size: [frame?.width ?? 1, frame?.height ?? 1],
      t: t.value,
      grid: DUST.grid,
      travel: DUST.travel,
      spread: DUST.spread,
    }),
    [frame],
  );

  const live = EFFECT !== null && dust !== null && frame !== undefined;

  // The canvas sits over the whole screen, so it has to be seen through and
  // tapped through. `pointerEvents` on a plain View is the reliable way to say
  // so on both platforms; left on the canvas alone, web keeps taking the taps
  // and nothing in the list can be struck through at all.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {live ? (
          <Rect
            x={frame.x - AIR.left}
            y={frame.y - AIR.top}
            width={frame.width + AIR.left + AIR.right}
            height={frame.height + AIR.top + AIR.bottom}
          >
            <Shader source={EFFECT!} uniforms={uniforms}>
              <ImageShader
                image={dust!.image}
                rect={rect(frame.x, frame.y, frame.width, frame.height)}
                fit="fill"
                tx="decal"
                ty="decal"
              />
            </Shader>
          </Rect>
        ) : null}
      </Canvas>
    </View>
  );
}

/**
 * Turns what `captureRef` hands back into something Skia can draw.
 *
 * Returns null rather than throwing if the decode fails: a quest that will not
 * snapshot should still strike through and leave the list, just without its
 * dust.
 */
export function dustImage(base64: string): SkImage | null {
  try {
    const data = Skia.Data.fromBase64(base64);
    return Skia.Image.MakeImageFromEncoded(data);
  } catch {
    return null;
  }
}
