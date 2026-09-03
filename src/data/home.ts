import type { GlyphName } from '../icons/Glyphs';

/**
 * What the Home frame shows ("Home", node 23:10380).
 *
 * Every string here is the text of a layer in that frame, transcribed verbatim.
 * None of it is wired to real progress yet — `useProgress` tracks lessons, not
 * quests or streaks — so this is the frame's own state, and it is the thing to
 * replace when there is a quest system behind it.
 */

export type Quest = {
  id: string;
  title: string;
  detail: string;
  /** Which chip sprite stands in front of the row. */
  glyph: GlyphName;
  xp: number;
  gems: number;
};

export type StreakDay = {
  /** "Mon" … "Sun". */
  label: string;
  /** The date shown once the day is no longer behind you. */
  date: number;
  done: boolean;
  today?: boolean;
};

/** "Frame 2147236266" — seven 44x56 cells, three struck through. */
export const STREAK = {
  days: 3,
  week: [
    { label: 'Mon', date: 9, done: true },
    { label: 'Tue', date: 10, done: true },
    { label: 'Wed', date: 11, done: true },
    { label: 'Thu', date: 12, done: false, today: true },
    { label: 'Fri', date: 13, done: false },
    { label: 'Sat', date: 14, done: false },
    { label: 'Sun', date: 15, done: false },
  ] as StreakDay[],
};

/**
 * "Frame 2147236455" — five 30x20 badges, the first three struck through and
 * the last two locked, over a track filled to just past the third.
 */
export const LEVEL = {
  level: 4,
  xp: 95,
  xpTo: 120,
  /** The five rungs the track is labelled with. */
  steps: [30, 60, 90, 120, 150],
  reached: 3,
};

/** The player's gem balance, from "Frame 2147235518". */
export const GEMS = 235;

/** Greeting, from "Frame 1". */
export const PLAYER = { name: 'James' };

/**
 * The five quest rows.
 *
 * The frame repeats "Morning Skincare Routine" for the fourth and fifth rows —
 * placeholder copy, the same way `paths.ts` runs out of real lessons after the
 * first five. Replace those two when the real quests exist; nothing else reads
 * this file.
 */
export const QUESTS: Quest[] = [
  {
    id: 'q-skincare-am',
    title: 'Morning Skincare Routine',
    detail: 'Apply cleanser, moisturizer and Shampoo',
    glyph: 'skincare',
    xp: 25,
    gems: 2,
  },
  {
    id: 'q-push-day',
    title: 'Push Day Workout',
    detail: 'Complete today’s push workout...',
    glyph: 'fitness',
    xp: 25,
    gems: 2,
  },
  {
    id: 'q-mewing',
    title: 'Mewing Practice',
    detail: '5 minutes of proper tongue posture and',
    glyph: 'oral',
    xp: 25,
    gems: 2,
  },
  {
    id: 'q-skincare-pm',
    title: 'Morning Skincare Routine',
    detail: 'Apply cleanser, moisturizer and Shampoo',
    glyph: 'skincare',
    xp: 25,
    gems: 2,
  },
  {
    id: 'q-hydrate',
    title: 'Morning Skincare Routine',
    detail: 'Apply cleanser, moisturizer and Shampoo',
    glyph: 'hair',
    xp: 25,
    gems: 2,
  },
];

/**
 * Which quests are struck through on a fresh day: none.
 *
 * The frame draws two of them checked, but that is a comp showing what a
 * completed row looks like, not a starting state — a quest list you did not
 * fill in cannot open with two of its five already done.
 */
export const SEED_DONE: string[] = [];
