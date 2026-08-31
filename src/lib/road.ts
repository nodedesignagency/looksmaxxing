export type Road = {
  /** SVG path data for the road's centre line. */
  d: string;
  /** Sampled arc length, for the draw-on dash animation. */
  length: number;
};

type Args = {
  /** Centre line x of the left column. */
  leftX: number;
  /** Centre line x of the right column. */
  rightX: number;
  /** Switchback corner radius. */
  corner: number;
  /** y positions where the road crosses from one column to the other. */
  crossings: number[];
  /** Where the road enters from, above the frame. */
  top: number;
  /** Where it leaves, below the last node. */
  bottom: number;
  /** Which column the road occupies before the first crossing. */
  startRight: boolean;
};

function quadLength(x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) {
  let total = 0;
  let px = x0;
  let py = y0;
  for (let i = 1; i <= 12; i++) {
    const t = i / 12;
    const u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1;
    const y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    total += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return total;
}

/**
 * Builds the winding road behind the lesson nodes.
 *
 * The frame draws it as two stacked vector layers whose bezier data the Figma
 * MCP connection could not return, so this reconstructs the same shape from
 * what the rendered frame shows: a road that runs down one column, turns
 * through a rounded switchback at the midpoint between two nodes, and runs back
 * down the other. The nodes are laid out beside it, never on it.
 */
export function buildRoad({
  leftX,
  rightX,
  corner,
  crossings,
  top,
  bottom,
  startRight,
}: Args): Road {
  let x = startRight ? rightX : leftX;
  let y = top;
  let d = `M ${x.toFixed(2)} ${y.toFixed(2)}`;
  let length = 0;

  const line = (nx: number, ny: number) => {
    length += Math.hypot(nx - x, ny - y);
    d += ` L ${nx.toFixed(2)} ${ny.toFixed(2)}`;
    x = nx;
    y = ny;
  };
  const curve = (cx: number, cy: number, nx: number, ny: number) => {
    length += quadLength(x, y, cx, cy, nx, ny);
    d += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)}, ${nx.toFixed(2)} ${ny.toFixed(2)}`;
    x = nx;
    y = ny;
  };

  for (const at of crossings) {
    const to = x === rightX ? leftX : rightX;
    // Sideways direction of this switchback: -1 heading left, +1 heading right.
    const dir = Math.sign(to - x);
    // Never let a corner eat more than half the run into or out of the turn.
    const r = Math.min(corner, Math.abs(to - x) / 2, Math.abs(at - y));

    line(x, at - r);
    curve(x, at, x + dir * r, at);
    line(to - dir * r, at);
    curve(to, at, to, at + r);
  }

  line(x, bottom);

  return { d, length };
}
