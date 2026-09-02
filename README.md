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

## Assets

The design's own exports now live under `assets/` — cloud plates, the four chip
sprites, and the icons.

The frame composites its clouds in **Overlay**, which matters: they are
grey-white photographs on transparency, and painted normally they sit on the sky
as grey smudges. `mixBlendMode` exists in React Native but react-native-web
drops it, so it cannot be checked on both targets from one place.

The plates are **baked offline instead**, by `scripts/bake-cloud.py`: each one's
own luminance is folded into its alpha and its colour set to white. Run it again
after re-exporting a plate.

Tinting the plates at runtime was the previous answer, and it only worked on
half of them, because the two exports are built oppositely:

| | RGB | alpha |
| --- | --- | --- |
| `cloud-2`, `cloud-3` | pure white throughout | **0% fully opaque** — carries the whole cloud |
| `cloud-main`, `cloud-1` | grey photograph, luminance 155–240 — **carries the whole cloud** | hard matte, 22% fully opaque |

`tintColor` keeps alpha and discards colour. On the first kind that changes
nothing. On the second it erases the channel the cloud is actually drawn in and
leaves the matte: a flat, dense slab with a cut edge, sitting among soft
feathered neighbours — which is exactly what it looked like. Baking turns the
second kind into the first, so one rule renders every plate, nothing is tinted
anywhere, and the modelling survives. The baked plates land between `cloud-2`
and `cloud-3` at every alpha percentile, which is what makes them read as the
same weight of cloud.

The original exports are in git history, at `dcc0332`.

`metro.config.js` runs `react-native-svg-transformer`,
so a `.svg` imports as a component; their colours were rewritten to
`currentColor` and each takes a `color` prop.

Play and lock came out of Figma as a solid rect masked by an embedded raster.
Rather than lean on SVG masks and patterns — the least portable corner of the
spec — the raster is extracted to `assets/icons/*.png` and tinted at runtime.
Same artwork, none of the risk.

Only two glyphs are still drawn by hand, because the export did not include
them: the Shop cart and the XP bolt. The road's switchbacks are also
reconstructed rather than taken from `Vector 4915` / `Vector 4916`.

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
- Nodes fade and lift in on a 34ms stagger, and only on the opening screenful.
  Nodes mount and unmount as the road scrolls, so replaying the entrance every
  time one re-entered the window set off a wave of them mid-scroll.

  The group animates **opacity and offset only**. Both are compositor work — the
  layer is rasterised once and then moves. Scale is not: it re-rasterises
  everything inside it every frame, and inside a node is a 16pt label, an XP pill
  and its bolt. The entrance scale moved onto the circle, where it costs a flat
  fill and one small glyph, and the completion pop went with it — the node alone
  is the sharper beat, and it lands on the glyph that just changed.

  It eases rather than springs, too. A spring that size overshoots by about a
  tenth, and the overshoot was landing on the label: text scaling past its own
  size and settling back is what read as wobble.
- Cloud plates parallax against scroll at three rates and drift on long loops.
- Nodes squash into their shadow on press; locked ones shake and buzz.
- The lesson you're on breathes a halo ring.
- Chips and the tab bar share one sliding pill. Chips switch category, which
  replays the road draw-on and the node stagger for that path; tabs with no
  screen behind them lean toward the tap and spring back.
- Completing a lesson pops the node, unlocks the next and bursts confetti; the
  tab bar drops away while the sheet is open.

## Lessons

All four categories lie end to end on one road: scrolling off the bottom of one
carries straight into the next, and the chip row follows where you are rather
than choosing what you see. Tapping a chip scrolls to that stretch.

The screen opens on the lesson you are up to rather than at the top of a road
you have already walked — the first lesson in road order you have not finished,
so once a category is done it carries on into the next one.

It lands that lesson on `probe` exactly, the same line the chip row reads the
category from, and that is load-bearing rather than incidental. Opening lower
down the screen frames the lesson better on its own, but it leaves the tail of
the previous category lying across the probe, and a screen showing a Skincare
lesson under a Fitness chip is worse than one that opens a little high. The
mount band and the active chip are seeded from the same offset, so the nodes
that belong on screen there are mounted for the first paint instead of arriving
a frame late.

The first five Fitness lessons are transcribed from the frame verbatim;
everything after them in `src/data/paths.ts` is placeholder text, there so each
category has a road long enough to travel. Replace those entries when real
curriculum exists — nothing else reads them.

## The lesson flow

Tap a node and a brief slides up. Start hands off to a full-screen interlude,
and when that ends the panel comes back green as a result card — check,
"Awesome!", XP earned — which is the beat the confetti fires on and the node
behind flips to a check. CONTINUE dismisses it.

The panel's top edge billows rather than being a rounded rectangle. It is not a
row of tangent semicircles — those meet in a sharp cusp at every valley, which
reads as scalloped rather than soft. `CloudEdge` uses whole circles of unequal
size, centred on the panel's top line and heavily overlapping. The valleys are
the shallow arcs where two circles cross, and the uneven radii are what keep it
from looking manufactured.

Depth comes from drawing each circle a second time as an inset stroke, with
fills and strokes **interleaved lobe by lobe**: every lobe's fill paints over
the arc of the one before it, so what survives is a short curve in the valley
where the two meet. Drawing all the arcs after all the fills instead leaves
whole rings floating on the surface. Insetting means an arc can never stray
outside the silhouette, so nothing needs clipping.

Each lobe carries four motions at once:

- **It unfolds.** As the panel opens the lobes inflate and straighten from a
  tilt, staggered left to right, so the cloud assembles itself at the moment the
  eye is already on the panel. They start at 0.45 scale rather than near zero —
  the biggest lobes have to stay taller than the skirt through the whole
  unfold, or its straight top edge is what you see instead of a cloud.
- **It drifts**, forever, on its own long loop. Moving the bank as one rigid
  piece is barely legible; moving the lobes against each other is what reads as
  billowing, because the valleys deepen and fill as they go.
- **It trails the panel** while the panel is dragged, by an amount that scales
  with its size, so the bank stretches instead of travelling as a slab.
- **It pops** when the button is pressed, as a wave timed outward from the
  centre. The button drives that shared value inside its own gesture worklet, so
  it starts on contact rather than a frame later.

The edge is drawn on a canvas wider than the panel and overlaps the body, so no
amount of motion exposes a corner or opens a seam.

Two things about how that motion is wired are load-bearing:

- **Lobes animate through path data**, rebuilding each circle from an animated
  centre and radius. An earlier version wrapped each lobe in an animated `<G>`
  and drove `scale`/`translate` on the group instead. That animated correctly in
  a browser and did nothing whatsoever on device, and because the paths carried
  no `d` of their own, "nothing" meant the lobes never drew at all — the panel
  showed its flat skirt and no cloud. Each path now also carries its resting
  shape as a static prop, so the worst case is a still cloud rather than none.
- **Shared values are read directly in the hook body**, not in a helper it
  calls. Reanimated decides what to subscribe to by reading the hook's own
  source; move the reads into a function it cannot see into and it subscribes to
  nothing, so the props evaluate once and sit frozen. The symptom is subtle —
  the cloud renders, at whatever size the first frame happened to compute.

A previous, simpler version of this edge — static, no depth — is kept on the
`cloud-v1-static` branch.

Buttons use the node's construction at a larger scale: a face over a darker
plate, pressed down onto it. The nodes offset by 2px, a button by 4.

### The interlude clip

`assets/lesson-clip.mp4` plays during a lesson, wired up in
`src/data/lessonClip.ts`. It is H.264 with AAC audio — the format iOS will play,
where it will not play WebM — 5.67 seconds long and 638x806.

`CLIP_SECONDS` is 6 to cover that: shorter would cut the clip off mid-frame,
longer holds on its last frame. Retime it alongside any replacement. The player
does not loop, so the third of a second between the clip ending and the
interlude ending is a held frame rather than a restart.

It is drawn `contentFit="contain"`. The clip is nearly square, so covering a
390x844 phone would crop about two fifths of its width and take the sides of the
frame with it; the interlude's background is near-black, so the bars above and
below read as letterboxing.

Set `LESSON_CLIP` back to `null` (the two lines are next to each other) and the
player falls back to a scene it draws itself — a turntable, a level meter and
notes coming off the top — so the flow still works with no asset at all. That
fallback is a source edit rather than a runtime check because Metro resolves
`require` at build time: pointing at a file that is not there fails the bundle.

Either way the interlude is always skippable.

## Keeping it light

Running every category on one road made the screen roughly five thousand points
tall, and three things quietly scaled with that:

- **Cloud count.** The backdrop repeated a cloud pair per 700pt of content, so a
  taller screen meant proportionally more sky — 19 clouds of 6 gradient puffs
  each. Now one pair per 1600pt, four puffs each.
- **The road's centre line** marched its dashes on an endless loop. On a
  5000-point path that is a full re-stroke every frame, forever, for a drift
  almost nobody would notice. It is static now.
- **A single SVG the height of the whole road.** `SkillRoad` slices into 1100pt
  bands, each drawing the same path through a group shifted by its own offset,
  so no layer is ever taller than a band.
- **The draw-on, running in every band at once.** Each band holds the *whole*
  path — the shift is what picks out its slice — so an animated
  `strokeDashoffset` on all of them meant re-walking and re-dashing five
  thousand points, five bands over, three strokes deep, every frame for the
  length of the animation. Fifteen full re-strokes a frame, and the node
  entrance was spending those same frames: most of what read as heavy nodes was
  the road underneath them. Only the bands the opening screen can see draw
  themselves on now; the rest are plain paths, laid down once. Nothing can watch
  them draw, and flicking down mid-intro finds a road already there.

Nodes are windowed too: each is an absolutely positioned view with a gesture
handler and two SVGs, and all four categories come to over thirty. Only those
within 700pt of the viewport are mounted, tracked in coarse 500pt bands so it
re-renders about once per screen of travel rather than per frame.

Together that halved the element count and cut the tallest layer from 5143pt to
1100.

## Node states

The frame draws three: a check on completed lessons, a play glyph on the one
you're up to, and a keyhole on the rest. Progress persists via AsyncStorage, and
the frame's starting state (two complete, the third current) is the seed.
