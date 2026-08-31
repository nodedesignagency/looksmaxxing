import type { GlyphName } from '../icons/Glyphs';

export type Lesson = {
  id: string;
  /** Title text, transcribed from the Figma text layers. */
  title: string;
  /** Every node in the frame carries a "+25 XP" pill. */
  xp: number;
};

export type SkillPath = {
  id: string;
  /** Chip label from "Frame 2147236480". */
  label: string;
  glyph: GlyphName;
  /** Accent used for this path's trail and current node. */
  accent: string;
  lessons: Lesson[];
  /**
   * Lessons already complete. The frame shows the first two nodes with a check
   * glyph, the third as current, and the last two with a play glyph.
   */
  seedCompleted: number;
};

const xp = 25;

/**
 * The four chips in "Frame 2147236480". Only Fitness has nodes drawn in the
 * frame, so it is the only path with content here — the other three are in the
 * design as chips and nothing more.
 */
export const PATHS: SkillPath[] = [
  {
    id: 'fitness',
    label: 'Fitness',
    glyph: 'dumbbell',
    accent: '#FF8A3D',
    seedCompleted: 2,
    lessons: [
      { id: 'fit-1', title: 'Why Fitness Matters', xp },
      { id: 'fit-2', title: 'Beginner Body weight', xp },
      { id: 'fit-3', title: 'Hypotrophy', xp },
      { id: 'fit-4', title: 'Athletic', xp },
      { id: 'fit-5', title: 'Posture Correction', xp },
    ],
  },
  { id: 'skincare', label: 'Skincare', glyph: 'droplet', accent: '#37B6C7', seedCompleted: 0, lessons: [] },
  { id: 'hair', label: 'Hair', glyph: 'scissors', accent: '#8A6BFF', seedCompleted: 0, lessons: [] },
  { id: 'oral', label: 'Oral Posture', glyph: 'smile', accent: '#F0568C', seedCompleted: 0, lessons: [] },
];

/** Chips that actually lead to a drawn path. */
export const AVAILABLE_PATHS = PATHS.filter((p) => p.lessons.length > 0).map((p) => p.id);
