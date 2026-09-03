/**
 * A quest row coming apart into dust.
 *
 * The row is snapshotted the moment its mark lands, and this shader is run on
 * that snapshot: the card erodes into particles from the left, and they drift
 * up and to the right as they thin out and fade.
 *
 * It is a paint shader over the snapshot rather than a real particle system.
 * A particle system would need a vertex per speck — tens of thousands, rebuilt
 * every frame — where this is one quad and a fragment. The trade is that
 * particles cannot be tracked individually, so the motion is inferred: for a
 * pixel, the shader works out which speck would have landed there and samples
 * the snapshot back along that speck's path. Neighbouring specks are jittered
 * apart, which is what makes the sampling read as grain rather than a smear.
 *
 * Three things happen at once, and all three are what sells it:
 *
 *   - **A front sweeps across.** Each cell's start is its x plus a jitter, so
 *     the left goes first and the edge between whole card and dust is ragged
 *     rather than a line.
 *   - **Cells wink out at their own moment.** Each has a random threshold, so
 *     the card thins to a scatter of survivors instead of fading as a sheet.
 *   - **Specks shrink and darken as they travel.** A cell starts as its full
 *     square and closes to a dot, so what is left late on is dust and not
 *     tiles; and it shades as it goes, which is what lets pale specks read
 *     against a white sheet at all.
 *
 * The card here is pale on a white sheet, so almost none of the contrast is in
 * the fill: it is the title, the sprite, the mark and the reward text. Working
 * from the snapshot rather than a colour is what makes those the specks you
 * actually see.
 */
export const DUST_SKSL = `
uniform shader image;

uniform float2 origin;    // the row's top-left, in canvas points
uniform float2 size;      // the row's size
uniform float t;          // 0-1, the whole flight
uniform float grid;       // speck size, in points
uniform float travel;     // how far the furthest speck gets
uniform float spread;     // how much the start is staggered across x

// A stable random per cell.
float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453);
}

half4 main(float2 xy) {
  float2 p = xy - origin;

  float2 cell = floor(p / grid);
  float r1 = hash(cell);
  float r2 = hash(cell + 37.0);
  float r3 = hash(cell + 91.0);

  // When this cell goes. Left first, jittered so the front is ragged.
  float x01 = clamp(p.x / size.x, 0.0, 1.0);
  float start = x01 * spread + r1 * 0.3;
  // Everything must be airborne by t=1, so the flight is what is left of the
  // clock once the last cell has started.
  float life = clamp((t - start) / max(1.0 - spread - 0.3, 0.05), 0.0, 1.0);

  // Where it came from. Up, and to the right, at its own speed.
  float2 dir = normalize(float2(0.34 + r2 * 0.5, -1.0));
  float d = travel * pow(life, 1.7) * (0.3 + r3);
  half4 c = image.eval(p - dir * d + origin);

  // The cell winks out at its own moment.
  float alive = step(r2, 1.0 - life * 0.86);

  // And closes from a square to a dot as it goes.
  float2 f = fract(p / grid) - 0.5;
  float dot_ = 1.0 - smoothstep(0.15, 0.5, length(f) * (1.0 + life * 2.0));
  float shape = mix(1.0, dot_, smoothstep(0.0, 0.5, life));

  // A last fade, so nothing pops out of existence at full strength.
  float fade = 1.0 - smoothstep(0.72, 1.0, life);

  // Airborne dust reads darker than the surface it came off, and here that is
  // what makes it read at all: the card is pale on a white sheet, so specks
  // carrying its fill are invisible until they are shaded. This is the one
  // liberty the effect takes with the snapshot's colour.
  c.rgb = c.rgb * half(mix(1.0, 0.72, life));

  return c * half(alive * shape * fade);
}
`;

/** How the row comes apart. Points and fractions of the flight. */
export const DUST = {
  /** Speck size. Small enough to read as grain, large enough to stay cheap. */
  grid: 2.2,
  /** How far the furthest speck travels. */
  travel: 112,
  /** How much of the flight the front takes to cross the row. */
  spread: 0.46,
  /**
   * Milliseconds, start to gone. Slow enough to watch: the front takes most
   * of a second to cross the row on its own, and the last specks are still in
   * the air well after it has passed.
   */
  duration: 1300,
  /** How long the gap sits open after the last speck before the list closes it. */
  hold: 220,
  /** And how long the closing itself takes. */
  close: 420,
};
