import type { GlyphName } from '../icons/Glyphs';

export type Lesson = {
  id: string;
  title: string;
  /** Every node in the frame carries a "+25 XP" pill. */
  xp: number;
};

export type SkillPath = {
  id: string;
  /** Chip label from "Frame 2147236480". */
  label: string;
  glyph: GlyphName;
  lessons: Lesson[];
  /**
   * Lessons already complete on a fresh install. The frame shows the first two
   * Fitness nodes with a check glyph and the third as current.
   */
  seedCompleted: number;
};

const xp = 25;
const l = (id: string, title: string): Lesson => ({ id, title, xp });

/**
 * The four chips in "Frame 2147236480", each with its own road.
 *
 * The frame only draws the Fitness path, and its first five lessons are
 * transcribed from it verbatim. The rest are written to give every category a
 * road long enough to actually travel — swap them for real curriculum when it
 * exists.
 */
export const PATHS: SkillPath[] = [
  {
    id: 'fitness',
    label: 'Fitness',
    glyph: 'fitness',
    seedCompleted: 2,
    lessons: [
      // --- from the Figma frame ---
      l('fit-1', 'Why Fitness Matters'),
      l('fit-2', 'Beginner Body weight'),
      l('fit-3', 'Hypotrophy'),
      l('fit-4', 'Athletic'),
      l('fit-5', 'Posture Correction'),
      // --- placeholder continuation ---
      l('fit-6', 'Neck Training'),
      l('fit-7', 'Cutting Basics'),
      l('fit-8', 'Building Your Split'),
    ],
  },
  {
    id: 'skincare',
    label: 'Skincare',
    glyph: 'skincare',
    seedCompleted: 0,
    lessons: [
      l('skin-1', 'Know Your Skin'),
      l('skin-2', 'The Core Routine'),
      l('skin-3', 'Sunscreen Daily'),
      l('skin-4', 'Actives 101'),
      l('skin-5', 'Fixing Acne'),
      l('skin-6', 'Under-Eye Care'),
      l('skin-7', 'Barrier Repair'),
      l('skin-8', 'Weekly Exfoliation'),
    ],
  },
  {
    id: 'hair',
    label: 'Hair',
    glyph: 'hair',
    seedCompleted: 0,
    lessons: [
      l('hair-1', 'Face Shape & Cut'),
      l('hair-2', 'Washing Correctly'),
      l('hair-3', 'Styling Products'),
      l('hair-4', 'Hairline Health'),
      l('hair-5', 'Beard Shaping'),
      l('hair-6', 'Barber Language'),
      l('hair-7', 'Heat & Damage'),
      l('hair-8', 'Growth Basics'),
    ],
  },
  {
    id: 'oral',
    label: 'Oral Posture',
    glyph: 'oral',
    seedCompleted: 0,
    lessons: [
      l('oral-1', 'What Is Mewing'),
      l('oral-2', 'Tongue Placement'),
      l('oral-3', 'Nasal Breathing'),
      l('oral-4', 'Jaw & Chewing'),
      l('oral-5', 'Sleep Position'),
      l('oral-6', 'Swallowing Pattern'),
      l('oral-7', 'Lip Seal Habit'),
      l('oral-8', 'Tracking Progress'),
    ],
  },
];
