/**
 * Figma's Glass material, as a Skia runtime shader.
 *
 * Figma's Glass is a lens, not a paint: near the edge it samples what is
 * behind the plate from displaced coordinates, so the backdrop is pulled and
 * bent into a band around the perimeter, and the edge is lit against the
 * light. Nothing built from views can do that — a border, an inset shadow, a
 * gradient stroke are all outlines, and an outline carries none of the image
 * behind it. This runs on the backdrop itself, so it does.
 *
 * It runs as a paint shader, not a backdrop filter. A backdrop filter would
 * read the canvas for it, but Skia's web backend has no runtime-shader image
 * filter at all — so that path could never be checked anywhere but a device.
 * A paint shader is handed its backdrop instead: the sky's gradient and the
 * two cloud plates, as child shaders placed exactly where the sky draws them.
 * Frost is baked into those plates (`scripts/frost-cloud.js`), since a shader
 * can no more blur an input than read the canvas. Everything here is then in
 * points, on every platform.
 *
 * The frame's sliders map onto the uniforms one to one:
 *
 *   Frost 67       blur of the backdrop — baked into the cloud plates
 *   Refraction 32  how far the sample is displaced at the rim
 *   Depth 95       how far in from the edge the bent band reaches
 *   Splay 48       the falloff curve across that band
 *   Dispersion 50  how far red and blue are split from green at the rim
 *   Light -45, 80% where the light comes from, and how hard the edge lights
 *   Fill 10%       the frame's own white, laid over the bent backdrop
 *
 * `amount` is not one of Figma's: it fades the effect in with the pill.
 */
export const GLASS_SKSL = `
uniform shader sky;         // the gradient
uniform shader cloudA;      // the frosted plates, placed as the sky draws them
uniform shader cloudB;
uniform float alphaA;       // and their opacities
uniform float alphaB;

uniform float2 origin;      // plate top-left, in points
uniform float2 size;        // plate size
uniform float radius;       // corner radius
uniform float refraction;   // pt of displacement at the rim
uniform float depth;        // pt the bent band reaches inward
uniform float splay;        // falloff exponent across the band
uniform float dispersion;   // pt of RGB split at the rim
uniform float edge;         // pt the bright line on the rim is wide
uniform float2 light;       // unit vector toward the light
uniform float lightAmt;     // 0-1
uniform float fill;         // 0-1, white laid over the whole plate
uniform float amount;       // 0-1, how much of the effect shows

// Signed distance to a rounded rectangle: negative inside, zero on the edge.
float sdRRect(float2 p, float2 b, float r) {
  float2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, float2(0.0))) - r;
}

// What is behind the plate at a point: the plates over the gradient,
// source-over in premultiplied colour, the way the sky paints them.
half4 backdrop(float2 uv) {
  half4 c = sky.eval(uv);
  half4 a = cloudA.eval(uv) * half(alphaA);
  c = a + c * (1.0 - a.a);
  half4 b = cloudB.eval(uv) * half(alphaB);
  c = b + c * (1.0 - b.a);
  return c;
}

half4 main(float2 xy) {
  float2 half_ = size * 0.5;
  float2 p = xy - origin - half_;
  // The frame's 43 on a 41-tall pill capsules it; past half the short side
  // the distance field breaks, so clamp the way Figma draws it.
  float r = min(radius, min(half_.x, half_.y));
  float d = sdRRect(p, half_, r);

  // The outward normal is the gradient of the distance field. Sampling it
  // rather than assuming a shape keeps the corners right.
  float e = 0.5;
  float2 n = float2(
    sdRRect(p + float2(e, 0.0), half_, r) - sdRRect(p - float2(e, 0.0), half_, r),
    sdRRect(p + float2(0.0, e), half_, r) - sdRRect(p - float2(0.0, e), half_, r)
  );
  float nl = length(n);
  n = nl > 0.0001 ? n / nl : float2(0.0, -1.0);

  // 1 at the rim, 0 once 'depth' inside; splay bends the ramp.
  float t = clamp(1.0 + d / max(depth, 0.001), 0.0, 1.0);
  float k = pow(t, splay);

  // The lens: the band shows the backdrop from beyond the edge, compressed.
  float2 uv = xy + n * (k * refraction);

  // Dispersion: red and blue are taken from either side of green.
  float ds = k * dispersion;
  half4 col;
  col.r = backdrop(uv + n * ds).r;
  col.g = backdrop(uv).g;
  col.b = backdrop(uv - n * ds).b;
  col.a = 1.0;

  // The frame's fill.
  col.rgb = mix(col.rgb, half3(1.0), half(fill));

  // Lighting. The edge facing the light is brightest, the edge opposite it
  // catches the light through the glass and is nearly as bright, and the
  // sides between them fall away. A thin line sits on the rim itself, and a
  // softer glow follows the bent band inward.
  float facing = max(dot(n, light), 0.0);
  float away = max(-dot(n, light), 0.0);
  float w = 0.3 + 0.7 * facing + 0.6 * away;
  float rim = 1.0 - smoothstep(0.0, edge, -d);
  float glow = k * (1.0 - rim);
  float lit = (rim * 0.9 + glow * 0.22) * w * lightAmt;
  col.rgb = col.rgb + half3(half(lit));

  // Fade by blending back toward the untouched backdrop.
  col.rgb = mix(backdrop(xy).rgb, col.rgb, half(amount));

  return col;
}
`;

/**
 * The frame's slider values, as the amounts the shader wants.
 *
 * Figma's sliders run 0-100 on their own scale; these are the conversions,
 * kept in one place so the pill can be retuned against the render rather than
 * guessed at twice. All in points.
 */
export const FIGMA_GLASS = {
  /** Frost 67: blur sigma, in pt. Baked into the plates; see scripts/frost-cloud.js. */
  blur: 6,
  /** Refraction 32: pt the sample is displaced at the rim. */
  refraction: 10,
  /** Depth 95: pt the band reaches in from the edge. */
  depth: 11,
  /** Splay 48. */
  splay: 1.8,
  /** Dispersion 50: pt. */
  dispersion: 2,
  /** The bright line on the rim, in pt. */
  edge: 0.6,
  /** Light -45 degrees: from the top-left. */
  light: [-0.7071, -0.7071] as [number, number],
  /** 80%. */
  lightAmt: 0.8,
  /** The frame's own fill: white at 10%. */
  fill: 0.1,
};
