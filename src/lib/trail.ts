export type Pt = { x: number; y: number };

export type Trail = {
  /** SVG path data for the whole trail. */
  d: string;
  /** Total arc length, sampled. */
  length: number;
  /**
   * Arc length from the start of the path to each node centre, so a progress
   * stroke can be dashed to end exactly on a node rather than near one.
   */
  lengthAt: number[];
  /**
   * Flat polyline of the same curve. Monotonic `l` against matching `x`/`y`
   * lets a worklet resolve "where on the trail is arc length L" with a plain
   * `interpolate()` — no path measurement at runtime.
   */
  poly: { l: number[]; x: number[]; y: number[] };
};

/** Sampling density per cubic segment. Enough for sub-pixel length accuracy. */
const SAMPLES = 24;

function cubicAt(p0: Pt, c1: Pt, c2: Pt, p1: Pt, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * c1.x + c * c2.x + d * p1.x,
    y: a * p0.y + b * c1.y + c * c2.y + d * p1.y,
  };
}

/**
 * Builds the winding trail that runs behind the lesson nodes.
 *
 * The Figma frame draws this as two stacked vector layers (1:124 / 1:125)
 * spanning y -36 -> 844, but their bezier data was not retrievable. This
 * reconstructs an equivalent serpentine by threading a smooth cubic spline
 * through the real node centres, with vertical control handles so the curve
 * leaves and enters every node straight down — which is what makes a trail read
 * as one continuous ribbon rather than a zigzag.
 */
export function buildTrail(
  points: Pt[],
  opts: { leadIn?: number; leadOut?: number } = {},
): Trail {
  const leadIn = opts.leadIn ?? 180;
  const leadOut = opts.leadOut ?? 140;

  const empty: Trail = { d: '', length: 0, lengthAt: [], poly: { l: [0], x: [0], y: [0] } };
  if (points.length === 0) return empty;

  const first = points[0];
  const last = points[points.length - 1];

  // Off-screen lead-in and lead-out, bowed sideways so the trail looks like it
  // continues past the frame instead of starting and stopping dead.
  const head: Pt = { x: first.x + 58, y: first.y - leadIn };
  const tail: Pt = { x: last.x + 58, y: last.y + leadOut };

  const knots: Pt[] = [head, ...points, tail];

  let d = `M ${head.x.toFixed(2)} ${head.y.toFixed(2)}`;
  let acc = 0;
  const lengthAt: number[] = [];
  const pl: number[] = [0];
  const px: number[] = [head.x];
  const py: number[] = [head.y];

  for (let i = 1; i < knots.length; i++) {
    const a = knots[i - 1];
    const b = knots[i];
    const k = (b.y - a.y) * 0.5;
    const c1: Pt = { x: a.x, y: a.y + k };
    const c2: Pt = { x: b.x, y: b.y - k };

    d += ` C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)}, ${c2.x.toFixed(2)} ${c2.y.toFixed(
      2,
    )}, ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;

    let prev = a;
    for (let s = 1; s <= SAMPLES; s++) {
      const cur = cubicAt(a, c1, c2, b, s / SAMPLES);
      acc += Math.hypot(cur.x - prev.x, cur.y - prev.y);
      // interpolate() needs a strictly increasing input range.
      pl.push(Math.max(acc, pl[pl.length - 1] + 0.0001));
      px.push(cur.x);
      py.push(cur.y);
      prev = cur;
    }

    // knots[1..points.length] are the node centres.
    if (i >= 1 && i <= points.length) lengthAt.push(acc);
  }

  return { d, length: acc, lengthAt, poly: { l: pl, x: px, y: py } };
}
