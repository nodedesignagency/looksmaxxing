import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PATHS } from '../data/paths';

const KEY = 'looksmaxxing/progress/v1';

/**
 * The rendered frame shows three node states: a check on the two completed
 * lessons, a play glyph on the one you're up to, and a keyhole on the rest.
 */
export type LessonStatus = 'done' | 'current' | 'locked';

type Saved = {
  completed: Record<string, string[]>;
  xp: number;
};

function seed(): Saved {
  const completed: Record<string, string[]> = {};
  let xp = 0;
  for (const path of PATHS) {
    const ids = path.lessons.slice(0, path.seedCompleted).map((l) => l.id);
    completed[path.id] = ids;
    xp += path.lessons.slice(0, path.seedCompleted).reduce((s, l) => s + l.xp, 0);
  }
  return { completed, xp };
}

export function useProgress() {
  const [saved, setSaved] = useState<Saved | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return;
        if (!raw) return setSaved(seed());
        try {
          const parsed = JSON.parse(raw) as Saved;
          // Merge in any path added since the save was written.
          const base = seed();
          setSaved({
            xp: parsed.xp ?? base.xp,
            completed: { ...base.completed, ...(parsed.completed ?? {}) },
          });
        } catch {
          setSaved(seed());
        }
      })
      .catch(() => alive && setSaved(seed()));
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback((next: Saved) => {
    setSaved(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
      /* a failed write only costs this session's progress */
    });
  }, []);

  const completeLesson = useCallback(
    (pathId: string, lessonId: string, xp: number) => {
      setSaved((prev) => {
        if (!prev) return prev;
        const current = prev.completed[pathId] ?? [];
        if (current.includes(lessonId)) return prev;
        const next: Saved = {
          xp: prev.xp + xp,
          completed: { ...prev.completed, [pathId]: [...current, lessonId] },
        };
        AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const reset = useCallback(() => persist(seed()), [persist]);

  return useMemo(
    () => ({
      ready: saved !== null,
      xp: saved?.xp ?? 0,
      completedByPath: saved?.completed ?? {},
      completeLesson,
      reset,
    }),
    [saved, completeLesson, reset],
  );
}

/** Resolves each lesson in a path to a display status. */
export function statusesFor(lessonIds: string[], completed: string[]): LessonStatus[] {
  const doneSet = new Set(completed);
  let currentIndex = lessonIds.findIndex((id) => !doneSet.has(id));
  if (currentIndex === -1) currentIndex = lessonIds.length;

  return lessonIds.map((id, i) => {
    if (doneSet.has(id)) return 'done';
    if (i === currentIndex) return 'current';
    return 'locked';
  });
}
