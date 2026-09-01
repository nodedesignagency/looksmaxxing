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

## Updating

```bash
cd ~/looksmaxxing
git fetch origin && git reset --hard origin/claude/figma-app-screen-animations-swxgjb
npm install
npx expo start -c
```

`reset --hard` rather than `pull`, on purpose. `package-lock.json` is tracked, so
anything that rewrites it locally — `npm install` after deleting it, most often —
leaves a modified tracked file, and `git pull` aborts rather than overwrite it.
The pull failing is quiet: the app just keeps running the old code. Resetting
throws that local churn away and lands exactly what is on the branch.

It also discards any edits of your own in this repo, so commit them first if you
have any.

`npm install` afterwards is cheap when nothing changed and necessary when a
dependency did. `-c` clears the Metro cache, which matters whenever a Babel
plugin or a native module version moved.

### A note on react-native-worklets

It is pinned to an exact version and repeated in `overrides`, deliberately.

Reanimated peer-depends on `react-native-worklets: 0.10.x`, so npm is free to
hoist one version for the runtime and nest a different one for the Babel plugin.
The plugin stamps its own version into every worklet it compiles and the runtime
throws if the two disagree:

```
[Worklets] Mismatch between JavaScript code version and Worklets Babel plugin version
```

The pin is `0.10.1` because that is the version Expo Go for SDK 57 ships
natively (`expo/bundledNativeModules.json`), so it has to match on all three
sides — plugin, JS and native. Do not widen it to a range, and re-pin it from
`bundledNativeModules.json` when upgrading the SDK.

## Why React Native and not Swift

Expo Go only runs React Native — Swift cannot load into it. For this screen the
animation ceiling is the same either way: Reanimated 3 runs every animation here
on the UI thread at native framerate, so the trail draw-on, spring buttons and
parallax do not touch the JS thread.

## Status of the Figma sync

Geometry is transcribed 1:1 from the frame — node positions, the 150px vertical
rhythm, the 48px face over its 2px shadow, chip padding, the 354x61 tab bar at an
18px inset, the 390x844 reference frame.

The Figma MCP connection is capped on this account — `get_design_context`,
`get_screenshot` and `download_assets` all return the plan's tool-call limit —
so nothing could be pulled automatically. These values were instead read off the
inspector panel and transcribed by hand, and they are exact:

| Element | Figma |
| --- | --- |
| Chip, selected | fill `F6FAFF`, 1px inside stroke `ECF0F9`, radius 38 |
| Chip, idle | fill `C3DDEF`, 1px inside stroke `ECF0F9` @50% |
| Chip metrics | 40 tall, 10 padding, 6 gap, label `000000` |
| Node face (child `1`) | 48x48 at (0,0), radius 30, fill `FFFFFF` |
| Node plate (child `2`) | 48x48 at (2,2), radius 30, fill `588AAB` |
| Node glyph | `588AAB` |
| Node title | Geist Regular 16, tracking -2%, `10334A` |
| "+25 XP" | Geist Regular 10, tracking -2.8%, `10AB6E` |
| Tab bar | radius 9999, fill `FFFFFF`, 1px inside `ECF0F9`, shadow x0 y2 blur20 black 10% |

The node's depth is that second plate, not a blur: two identical circles two
pixels apart, the lower one showing through as a crescent. Pressing a node
slides the face those two pixels onto its plate, closing the gap the depth is
made of.

Still redrawn, because they are raster fills that could not be exported:

| What | Currently | Figma layer |
| --- | --- | --- |
| Clouds | soft-edged ellipse clusters | `07_Clouds 1`, `08_Clouds 1`, `image-from-rawpixel-...` |
| Chip icons | flat redraws in `588AAB` | `freepik_..._Photoroom` 20x20 rendered 3D icons |
| Node/tab icons | drawn on Solar's 24px grid | `solar:play-bold`, `Interface / Check`, `Linear / ... Home Angle`, `Cart Large`, `Chart 2` |
| Road curve | switchbacks reconstructed from the render | `Vector 4915` / `Vector 4916` |

Every colour, radius and road dimension lives in `src/theme/tokens.ts`.

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
- Chips and the tab bar share one sliding pill. Chips switch category, which
  replays the road draw-on and the node stagger for that path; tabs with no
  screen behind them lean toward the tap and spring back.
- Completing a lesson pops the node, unlocks the next and bursts confetti; the
  tab bar drops away while the sheet is open.

## Lessons

Each of the four chips has its own road. The first five Fitness lessons are
transcribed from the frame verbatim; everything after them in `src/data/paths.ts`
is placeholder text, there so each category has a road long enough to travel.
Replace those entries when real curriculum exists — nothing else reads them.

## The lesson flow

Tap a node and a brief slides up. Start hands off to a full-screen interlude,
and when that ends the panel comes back green as a result card — check,
"Awesome!", XP earned — which is the beat the confetti fires on and the node
behind flips to a check. CONTINUE dismisses it.

The panel's top edge billows rather than being a rounded rectangle. It is not a
row of tangent semicircles — those meet in a sharp cusp at every valley, which
reads as scalloped rather than soft. `CloudEdge` uses whole circles of unequal
size, centred on the panel's top line and heavily overlapping, each emitted as a
subpath of one path wound the same way so the nonzero fill rule unions them. The
valleys are then just the shallow arcs where two circles cross, and the uneven
radii are what keep it from looking manufactured.

Buttons use the node's construction at a larger scale: a face over a darker
plate, pressed down onto it. The nodes offset by 2px, a button by 4.

### The interlude clip

`src/data/lessonClip.ts` holds the clip that plays during a lesson. Nothing
ships there, so the player falls back to a scene it draws itself — a turntable,
a level meter and notes coming off the top — and the flow works with no asset
at all.

To use a real clip, drop it in as `assets/lesson-clip.mp4` and uncomment the
`require` in that file. It has to be **H.264 in an .mp4**; iOS will not play
WebM. `CLIP_SECONDS` sets how long the interlude runs, and it is always
skippable.

## Node states

The frame draws three: a check on completed lessons, a play glyph on the one
you're up to, and a keyhole on the rest. Progress persists via AsyncStorage, and
the frame's starting state (two complete, the third current) is the seed.
