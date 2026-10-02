import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Path } from 'react-native-svg';
import type { Road } from '../lib/road';
import { colors, road as roadTokens } from '../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * The white road and its dashed centre line, drawn on once from the top.
 *
 * Sliced into bands rather than one tall SVG. The road runs the length of every
 * category laid end to end — five thousand points and climbing — and a single
 * SVG that size is one enormous layer for the platform to hold and rasterise.
 * Each band draws the same path through a group shifted up by its own offset,
 * and clips to its own height, so no layer is ever taller than BAND.
 *
 * Only the bands the opening screen can actually see draw themselves on. Every
 * band holds the whole path — the shift is what picks out its slice — so an
 * animated `strokeDashoffset` on all of them meant re-walking and re-dashing
 * five thousand points, five times over, three strokes deep, every frame for
 * the length of the animation. Fifteen full re-strokes a frame, and the node
 * entrance was spending those same frames: what read as heavy nodes was largely
 * the road underneath them. The rest are plain paths, laid down once and never
 * touched again — nothing can see them draw, and flicking down mid-intro finds
 * a road already there rather than one still arriving.
 */

/** Height of one slice. Small enough to stay cheap, large enough to stay few. */
const BAND = 1100;

/** How long the road takes to draw itself on. See the note in the component. */
const ENTRANCE = 520;

type Props = {
  width: number;
  height: number;
  /** Viewport height, so only the bands on screen at rest draw themselves on. */
  viewport: number;
  road: Road;
  /** Bumped when the path changes, to replay the draw-on. */
  drawKey: string;
};

export default function SkillRoad({ width, height, viewport, road, drawKey }: Props) {
  const total = road.length || 1;
  const { on, off } = roadTokens.dash;

  // 0 -> 1 draws the whole ribbon on, from the top downward.
  const draw = useSharedValue(0);

  /**
   * Matched to the Home screen's entrance, which is the rhythm the app reads
   * at: a 380ms cubic ease-out per band on a 70ms stagger. This is a sweep
   * across a whole screenful rather than one band fading up, so it is given a
   * little longer than 380 — but only a little. At a full second the road was
   * still arriving after every node had landed on it, and the screen felt
   * slow because the biggest thing on it was the last to turn up.
   */
  useEffect(() => {
    draw.value = 0;
    draw.value = withTiming(1, { duration: ENTRANCE, easing: Easing.out(Easing.cubic) });
  }, [drawKey, draw]);

  // Dash the full length off, then pull the offset to zero to draw the road.
  const surfaceProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - draw.value) * total,
  }));

  /**
   * The centre line comes up behind the surface, and is fully in before the
   * road has finished drawing. It used to wait until the draw was 45% done and
   * only reach full strength at the very end, so the dashes were still fading
   * up after the road had arrived — half the reason the entrance dragged.
   */
  const dashProps = useAnimatedProps(() => ({
    opacity: Math.min(1, Math.max(0, (draw.value - 0.25) / 0.45)),
  }));

  /** Soft ground shadow, so the road sits above the sky. */
  const shadow = {
    d: road.d,
    stroke: colors.roadShadow,
    strokeWidth: roadTokens.width + 6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
    translateY: 4,
  } as const;

  /** The surface. */
  const surface = {
    d: road.d,
    stroke: colors.road,
    strokeWidth: roadTokens.width,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  } as const;

  /** Centre line. Static: marching the dashes meant re-stroking the whole road
      every frame, forever, for a barely visible drift. */
  const centre = {
    d: road.d,
    stroke: colors.roadDash,
    strokeWidth: roadTokens.dash.width,
    strokeLinecap: 'round',
    fill: 'none',
    strokeDasharray: `${on} ${off}`,
  } as const;

  const bands = Math.max(1, Math.ceil(height / BAND));
  const drawnOn = Math.max(1, Math.ceil(viewport / BAND));
  const dashAll = `${total} ${total}`;

  return (
    <>
      {Array.from({ length: bands }, (_, i) => {
        const top = i * BAND;
        return (
          <Svg
            key={i}
            width={width}
            height={Math.min(BAND, height - top)}
            style={{ position: 'absolute', top, left: 0 }}
            pointerEvents="none"
          >
            <G translateY={-top}>
              {i < drawnOn ? (
                <>
                  <AnimatedPath
                    {...shadow}
                    strokeDasharray={dashAll}
                    animatedProps={surfaceProps}
                  />
                  <AnimatedPath
                    {...surface}
                    strokeDasharray={dashAll}
                    animatedProps={surfaceProps}
                  />
                  <AnimatedPath {...centre} animatedProps={dashProps} />
                </>
              ) : (
                <>
                  <Path {...shadow} />
                  <Path {...surface} />
                  <Path {...centre} />
                </>
              )}
            </G>
          </Svg>
        );
      })}
    </>
  );
}
