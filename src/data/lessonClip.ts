/**
 * The clip that plays while a lesson "runs".
 *
 * `assets/lesson-clip.mp4` is H.264 video with AAC audio in an .mp4, which is
 * what iOS will play — it will not play WebM, so keep any replacement in that
 * format. Delete the file and swap the two lines below and the player falls
 * back to a scene it draws itself, so the flow still works with no asset at all.
 *
 * The require stays a literal path because Metro resolves it at build time:
 * pointing at a file that is not there fails the bundle rather than falling
 * back at runtime, which is why the fallback is a source edit and not a check.
 */

export const LESSON_CLIP: number | null = require('../../assets/lesson-clip.mp4');
// export const LESSON_CLIP: number | null = null;

/**
 * How long the interlude runs before the result card appears.
 *
 * The clip is 5.67s, so this is it rounded up: long enough for the whole thing
 * to play out rather than being cut mid-frame. Retime it if the clip changes —
 * a value shorter than the clip truncates it, and a longer one holds on the
 * last frame. It is always skippable either way.
 */
export const CLIP_SECONDS = 6;
