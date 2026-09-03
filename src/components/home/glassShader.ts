
/**
 * Figma's Glass material, as a Skia runtime effect.
 *
 * The thing every hand-drawn attempt at this missed: **the bright rim is not
 * paint, it is the backdrop bent.** Figma's Glass is a lens. Near the edge it
 * samples what is behind the plate from displaced coordinates, so the sky gets
 * pulled and compressed into a band around the perimeter, and that band is what
 * reads as a lit edge. Draw a border, an inset shadow or a stack of rings and
 * you get an outline; none of them carry the image behind, so none of them look
 * like it.
 *
 * The frame's parameters map onto this directly:
 *
 *   Refraction 32  how far the sampling is displaced at the rim
 *   Depth 95       how far in from the edge the band reaches
 *   Dispersion 50  how far R and B are split from G, giving the rim its fringe
 *   Splay 48       the falloff curve across that band
 *   Light -45, 80% direction and strength of the specular
 *   Frost 67       blur, applied to the input before this runs
 *
 * `xy` arrives in the filter's coordinate space rather than the plate's, so the
 * plate's origin comes in as a uniform and everything works in `local`.
 */
export const GLASS_SKSL = `
uniform shader image;

uniform float2 origin;      // plate top-left, in filter space
uniform float2 size;        // plate size
uniform float radius;       // corner radius
uniform float refraction;   // px of displacement at the rim
uniform float depth;        // px the band reaches inward
uniform float dispersion;   // px of RGB split at the rim
uniform float splay;        // falloff exponent across the band
uniform float2 light;       // unit vector the light comes from
uniform float lightAmt;     // 0-1

// Signed distance to a rounded rectangle: negative inside, zero on the edge.
float sdRRect(float2 p, float2 b, float r) {
  float2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, float2(0.0))) - r;
}

half4 main(float2 xy) {
  float2 local = xy - origin;
  float2 half_ = size * 0.5;
  float2 p = local - half_;
  float d = sdRRect(p, half_, radius);

  // The outward normal is the gradient of that distance field. Sampling it
  // rather than assuming a shape keeps the corners correct.
  float e = 1.0;
  float2 n = float2(
    sdRRect(p + float2(e, 0.0), half_, radius) - sdRRect(p - float2(e, 0.0), half_, radius),
    sdRRect(p + float2(0.0, e), half_, radius) - sdRRect(p - float2(0.0, e), half_, radius)
  );
  float nl = length(n);
  n = nl > 0.0001 ? n / nl : float2(0.0, -1.0);

  // 1 at the rim, 0 once we are 'depth' inside. Splay bends that ramp.
  float t = clamp(1.0 + d / max(depth, 0.001), 0.0, 1.0);
  float k = pow(t, splay);

  // The lens: pull the sample point outward, hardest at the rim.
  float2 uv = xy - n * (k * refraction);

  // Dispersion: red and blue come from either side of green.
  float ds = k * dispersion;
  half4 col;
  col.r = image.eval(uv - n * ds).r;
  col.g = image.eval(uv).g;
  col.b = image.eval(uv + n * ds).b;
  col.a = 1.0;

  // Specular: brightest where the edge faces the light.
  float spec = pow(max(dot(n, light), 0.0), 4.0) * k * lightAmt;
  col.rgb = col.rgb + half3(half(spec));

  return col;
}
`;

/**
 * Compiled on first use, not at module scope.
 *
 * On the web target Skia is CanvasKit, and its WASM has not loaded while
 * modules are evaluating — `Skia.RuntimeEffect` is undefined at that point and
 * the whole app fails to boot. Native has it synchronously, so this only costs
 * a null check.
 */
let compiled: unknown | null | undefined;

/**
 * Whether Skia can actually draw here.
 *
 * Native links Skia in, so this is always true there. On web it is CanvasKit,
 * whose WASM has to be fetched and wired into the JS API before a Canvas can
 * record anything — until then `PictureRecorder` and friends are undefined and
 * rendering a Canvas throws. Checking one of them is the cheapest honest test.
 */
export function skiaReady(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Skia } = require('@shopify/react-native-skia');
    return Boolean(Skia?.PictureRecorder && Skia?.RuntimeEffect?.Make);
  } catch {
    return false;
  }
}

export function glassEffect() {
  if (compiled === undefined) {
    try {
      // Required here rather than imported at the top: on web the `Skia`
      // binding is populated by `LoadSkiaWeb` after modules have evaluated, and
      // a module-scope import can hold the pre-load value.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Skia } = require('@shopify/react-native-skia');
      compiled = Skia?.RuntimeEffect?.Make ? Skia.RuntimeEffect.Make(GLASS_SKSL) : null;
    } catch {
      compiled = null;
    }
  }
  return compiled as never;
}

/**
 * The frame's slider values, converted to the pixel amounts the shader wants.
 * Figma's are 0-100 on its own scale, so these are the conversions, kept in one
 * place so they can be retuned against the render rather than guessed twice.
 */
export const FIGMA_GLASS = {
  /** Refraction 32. */
  refraction: 9,
  /** Depth 95, as a share of the plate's short side. */
  depthRatio: 0.42,
  /** Dispersion 50. */
  dispersion: 1.6,
  /** Splay 48. */
  splay: 2.2,
  /** Light -45 degrees, 80%. */
  light: [-0.7071, -0.7071] as [number, number],
  lightAmt: 0.32,
  /** Frost 67. */
  blur: 8,
};
