#!/usr/bin/env node
/**
 * Bake a frosted copy of a cloud plate, for the gem pill's glass.
 *
 * The pill is a lens over the sky, run as a paint shader, and a paint shader
 * cannot read the canvas — it has to be handed the backdrop as shader inputs.
 * The sky's gradient is a shader already; the cloud plates go in as image
 * shaders, positioned exactly as the sky draws them. Figma's Frost (67) blurs
 * that backdrop, and a shader cannot blur an input either, so the blur is
 * baked into these copies once. The gradient is smooth enough that blurring
 * it would change nothing.
 *
 * Sigma is given in points and converted to the plate's own pixels through the
 * box it is drawn into with `fit: contain`, so the frost is the same softness
 * on screen whatever the plate's resolution.
 *
 *   node scripts/frost-cloud.js <in.png> <out.png> <boxW> <boxH> <sigmaPt>
 *
 * Run it again after re-exporting a plate, or if the pill's Frost changes.
 */
const fs = require('fs');
const path = require('path');
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');

const [, , input, output, boxW, boxH, sigmaPt] = process.argv;
if (!sigmaPt) {
  console.error('usage: frost-cloud.js <in.png> <out.png> <boxW> <boxH> <sigmaPt>');
  process.exit(1);
}

CanvasKitInit({
  locateFile: (f) => path.join(path.dirname(require.resolve('canvaskit-wasm/bin/full/canvaskit.js')), f),
}).then((ck) => {
  const img = ck.MakeImageFromEncoded(fs.readFileSync(input));
  const w = img.width();
  const h = img.height();
  // The plate is drawn into its box with `contain`, so one point is this many
  // of its pixels.
  const scale = 1 / Math.min(Number(boxW) / w, Number(boxH) / h);
  const sigma = Number(sigmaPt) * scale;

  const surface = ck.MakeSurface(w, h);
  const paint = new ck.Paint();
  // Decal: the plate's edges bleed to nothing rather than smearing.
  paint.setImageFilter(ck.ImageFilter.MakeBlur(sigma, sigma, ck.TileMode.Decal, null));
  surface.getCanvas().drawImage(img, 0, 0, paint);
  surface.flush();
  fs.writeFileSync(output, Buffer.from(surface.makeImageSnapshot().encodeToBytes()));
  console.log(`${path.basename(output)}: ${w}x${h}, sigma ${sigma.toFixed(1)}px for ${sigmaPt}pt`);
});
