# Skill Path — Figma → Expo

The "Skill Path" screen from the Figma frame
[`8f75PaORkRIvmfXHiThjdm` node `1:118`](https://www.figma.com/design/8f75PaORkRIvmfXHiThjdm/Untitled?node-id=1-118),
built as a React Native app that runs in Expo Go.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS or Android).

## Why React Native and not Swift

Expo Go only runs React Native — Swift cannot load into it. For this screen the
animation ceiling is the same either way: Reanimated 3 runs every animation here
on the UI thread at native framerate, so the trail draw-on, spring buttons and
parallax do not touch the JS thread.

## Status of the Figma sync

Geometry is transcribed 1:1 from the frame — node positions, the 150px vertical
rhythm, the 48px face over its 2px shadow, chip padding, the 354x61 tab bar at an
18px inset, the 390x844 reference frame.

Colour and type are read off a render of the frame, because the Figma MCP
connection hit the account plan's tool-call limit right after returning the
layer tree — `get_design_context`, `get_screenshot` and `download_assets` all
came back capped, so no variables and no exports.

Everything visual is therefore matched by eye, and these are redraws standing in
for assets that could not be exported:

| What | Currently | Figma layer it stands in for |
| --- | --- | --- |
| Clouds | soft-edged ellipse clusters | `07_Clouds 1`, `08_Clouds 1`, `image-from-rawpixel-...` (photographic plates) |
| Chip icons | flat redraws in the screen's blue/slate | `freepik_..._Photoroom` 20x20 rendered 3D icons |
| Node/tab icons | drawn on Solar's 24px grid | `solar:play-bold`, `Interface / Check`, `Linear / ... Home Angle`, `Cart Large`, `Chart 2` |
| Road curve | switchbacks reconstructed from the render | `Vector 4915` / `Vector 4916` |
| Type | system font (SF Pro / Roboto) | unknown |

Every colour, radius and road dimension lives in `src/theme/tokens.ts`, so
re-syncing is a one-file edit once the real values are available.

## Layout

```
src/
  theme/tokens.ts      colours, Figma geometry, springs, header metrics
  data/paths.ts        the five lessons and four chips from the frame
  state/useProgress.ts persisted completion + lesson status resolution
  lib/road.ts          builds the switchback road and its arc length
  icons/Glyphs.tsx     Solar-style vector icons
  components/          Backdrop, SkillRoad, SkillNode, CategoryTabs,
                       Header, TabBar, LessonSheet, Celebration
  screens/SkillPathScreen.tsx
```

## Motion

- The road draws itself on from the top with an animated dash offset, then its
  centre line fades up and marches slowly along the surface.
- Nodes spring in on a 70ms stagger.
- Cloud plates parallax against scroll at three rates and drift on long loops.
- Nodes squash into their shadow on press; locked ones shake and buzz.
- The lesson you're on breathes a halo ring.
- Chips and the tab bar share one sliding pill; chips with no drawn path, and
  tabs with no screen behind them, lean toward the tap and spring back.
- Completing a lesson pops the node, unlocks the next and bursts confetti; the
  tab bar drops away while the sheet is open.

## Node states

The frame draws three: a check on completed lessons, a play glyph on the one
you're up to, and a keyhole on the rest. Progress persists via AsyncStorage, and
the frame's starting state (two complete, the third current) is the seed.
