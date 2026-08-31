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

**Colour, typography and imagery are NOT from the file.** The Figma MCP
connection hit the account plan's tool-call limit immediately after returning the
layer tree, so `get_design_context`, `get_screenshot` and `download_assets` all
failed. That means these are placeholders standing in for the real design:

| What | Currently | Figma layer it stands in for |
| --- | --- | --- |
| Whole palette | invented sky/green/amber set in `src/theme/tokens.ts` | — |
| Type | Nunito | unknown |
| Clouds | vector ellipse clusters | `07_Clouds 1`, `08_Clouds 1` |
| Sun / blobs | radial gradients | `Ellipse 266`, `Ellipse 267` |
| Warm haze | radial gradient | `image-from-rawpixel-id-6117623-png 3` |
| Chip icons | Solar-style glyphs | `freepik_..._Photoroom` 20x20 rasters |
| Node/tab icons | hand-drawn on Solar's 24px grid | `solar:play-bold`, `Interface / Check`, `Linear / ... Home Angle`, `Cart Large`, `Chart 2` |
| Trail curve | spline threaded through the node centres | `Vector 4915` / `Vector 4916` |
| Node corner radius | 16px squircle | unknown (frames, radius not exposed) |

Every colour and radius lives in `src/theme/tokens.ts`, so re-syncing is a
one-file edit once the real values are available.

## Layout

```
src/
  theme/tokens.ts      colours, Figma geometry, springs, header metrics
  data/paths.ts        the five lessons and four chips from the frame
  state/useProgress.ts persisted completion + lesson status resolution
  lib/trail.ts         builds the winding path, arc lengths, polyline
  icons/Glyphs.tsx     Solar-style vector icons
  components/          Backdrop, SkillTrail, SkillNode, CategoryTabs,
                       Header, TabBar, LessonSheet, Celebration
  screens/SkillPathScreen.tsx
```

## Motion

- Trail draws itself on with an animated dash offset; the completed run is a
  second stroke dashed to end exactly on a node's arc length.
- Nodes spring in on a 70ms stagger.
- Backdrop layers parallax against scroll at different rates and drift on a loop.
- Node buttons press down onto their 2px shadow; locked ones shake.
- The current node breathes a halo, and a spark travels the gap to it.
- Chips and tab bar share one sliding pill; chips with no drawn path rubber-band.
- Completing a lesson pops the node, extends the coloured trail and bursts confetti.
