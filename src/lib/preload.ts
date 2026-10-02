import { Asset } from 'expo-asset';
import { BACKDROP_IMAGES } from '../components/Backdrop';
import { CHIP_IMAGES, LOCK_IMAGE, PLAY_IMAGE } from '../icons/Glyphs';

/**
 * Warming the Skill Path's images while Home is on screen.
 *
 * Home is built at launch and Skill Path is not — it lays out a five thousand
 * point road across five SVG bands and a windowed node list, and it opens
 * itself on the lesson you are up to by scrolling on its first layout, which
 * goes nowhere if that layout happens while the screen is hidden. So the
 * screen stays lazy. Its *images* need not be.
 *
 * Nothing fetches a bundled image until something renders it, and in Expo Go
 * that fetch goes over the dev server. Pressing Path was therefore the moment
 * three cloud plates — about 290KB of them — plus the play and keyhole glyphs
 * started loading, and they arrived visibly late, one after another, on a
 * screen that was otherwise already drawn.
 *
 * Pulling them in behind Home costs nothing anyone sees: Home is up, the
 * fonts are in, and the connection is idle. By the time Path is pressed they
 * are decoded and it draws in one go.
 *
 * The lists come from the modules that own the images rather than being
 * restated here, so adding a plate warms it without anyone remembering to.
 */
const PATH_IMAGES = [
  ...BACKDROP_IMAGES,
  ...Object.values(CHIP_IMAGES),
  PLAY_IMAGE,
  LOCK_IMAGE,
];

/**
 * Fire and forget. A warm-up that fails has cost nothing — the image loads on
 * demand as it always did — so there is nothing to report and nothing to wait
 * for.
 */
export function warmPathImages() {
  Asset.loadAsync(PATH_IMAGES).catch(() => {});
}
