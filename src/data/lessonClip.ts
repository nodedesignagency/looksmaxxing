/**
 * The clip that plays while a lesson "runs".
 *
 * Nothing ships here by default, so the player falls back to its own animated
 * scene and the app is complete without any asset.
 *
 * To use a real clip:
 *   1. Drop the file in as `assets/lesson-clip.mp4`.
 *      Use H.264 in an .mp4 — iOS will not play WebM.
 *      Keep it short; the player runs it for CLIP_SECONDS and then moves on.
 *   2. Uncomment the require below.
 *
 * It stays commented because Metro resolves `require` at build time: pointing
 * at a file that is not there fails the bundle rather than falling back.
 */

// export const LESSON_CLIP = require('../../assets/lesson-clip.mp4');
export const LESSON_CLIP: number | null = null;

/** How long the interlude runs before the result card appears. */
export const CLIP_SECONDS = 4;
