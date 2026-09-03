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
git fetch origin && git reset --hard origin/claude/github-app-review-u23xue
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
  data/home.ts         the streak, level and quests from the Home frame
  state/useProgress.ts persisted completion + lesson status resolution
  lib/road.ts          builds the switchback road and its arc length
  icons/Glyphs.tsx     Solar-style vector icons
  components/          Backdrop, SkillRoad, SkillNode, CategoryTabs,
                       Header, TabBar, LessonSheet, Celebration
  components/home/     StreakCard, LevelCard, QuestRow
  screens/SkillPathScreen.tsx
  screens/HomeScreen.tsx
```

`App.tsx` holds the two screens the tab bar can reach. Home is built at launch;
Skill Path is built the first time Path is pressed and kept from then on. Not
both up front, for two reasons: Skill Path lays out a five thousand point road
across five SVG bands and a windowed node list, which is not worth doing at
launch for a screen behind a tab you may not press — and it opens itself on the
lesson you are up to by scrolling on its first layout, which goes nowhere if
that layout happens while the screen is hidden. Once built, a screen is hidden
rather than unmounted, so coming back finds the scroll position it was left
with.

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

## Home

"Home" — node `23:10380`, the second screen in the file. Three bands on the sky,
scrolling together: the greeting, the streak card, and a sheet from y=310
carrying the level card and the quest list.

### What could be read out of Figma, and what could not

The MCP connection is capped on this account. One `get_metadata` call returned
before the cap bit; `get_design_context`, `get_variable_defs`, `get_screenshot`
and `download_assets` all refuse. The public embed is no way round it either —
`embed.figma.com` redirects to `www.figma.com`, which this session's egress
policy answers with a 403.

So the split is:

| | source | exact? |
| --- | --- | --- |
| Geometry — every position, size, inset and gap | `get_metadata` | yes, transcribed |
| Copy — every string | `get_metadata` layer names | yes |
| Colour | design context / inspector where it was shared, else read off the render | exact where shared |
| Type sizes | design context where it was shared, else solved from box widths | exact where shared |
| Raster art — medal, gem, crown, avatar | exported by hand from the file | yes |

Those four could not be pulled through the capped MCP, so they were exported
from Figma directly and live in `assets/home/` as `medal.png`, `gem.png`,
`crown.png` and `avatar.png`.

Each is drawn **larger than its box**, because the artwork carries transparent
padding and, on the medal, a glow and sparkles that reach past the badge. The
node tree gives both numbers — a 20x20 gem frame holding a 31x31 raster, a 60x60
medal frame holding a 176x117 one — so `Plate` in `Glyphs.tsx` keeps the box for
layout and lets the art overflow it, centred. Fit the art to the box instead and
the medal loses its sparkles to the crop; size the box to the art and every row
beside it shifts.

The crown is the one exception. Its frame puts a 34x35 raster in a 20x20 box,
but that box clips in Figma and nothing clips here, so at 1.72 the crown ran
into the "L" of "Level 4". It is sized so its ink fills the 20 it is given,
which is what the rendered frame shows.

The three quest sprites are the exception: the frame uses the same artworks the
category chips already use, so they are `require`d from `CHIP_IMAGES` rather
than redrawn. The medal, gem and crown are new vectors on the same 24px grid as
the other hand-drawn glyphs, and the avatar stands in for a photo.

### The glass, and what is not glass

**Only the gem pill is glass.** The streak card looks frosted in the comp and
was built that way at first, from the render — wrong. Its inspector reads an
opaque `F6FAFF` fill with a 1px inside stroke in `ECF0F9` at radius 12, holding
a white plate at radius 8 with the same stroke. `F6FAFF` over this sky simply
*looks* like glass, and the tell is that the cloud behind it never moves through
it. The counter pill is not glass either: it sits on the white sheet with
nothing behind it worth blurring.

The gem pill carries Figma's Glass material: Frost 67, Light −45° at 80%,
Refraction 32, Depth 95, Dispersion 50, Splay 48, over a 10% white fill with no
stroke. That material is a **lens**: near the edge it samples what is behind
the plate from displaced coordinates, so the backdrop is pulled and bent into a
band around the perimeter, and the edge is lit against the light. Nothing built
from views can do that — a blur under a fill under a rim, a gradient stroke, an
inset shadow, and Apple's Liquid Glass were all tried here, and every one draws
an outline, and an outline carries none of the image behind it.

So the pill is a shader. `components/home/glassShader.ts` is Figma's Glass as
SkSL, with the frame's sliders as its uniforms:

| Slider | Uniform |
| --- | --- |
| Frost 67 | blur of the backdrop, baked into the cloud plates (below) |
| Refraction 32 | how far the sample is displaced at the rim |
| Depth 95 | how far in from the edge the bent band reaches |
| Splay 48 | the falloff curve across that band |
| Dispersion 50 | how far red and blue are split from green at the rim |
| Light −45° 80% | where the light comes from, and how hard the edge lights |
| Fill 10% | the frame's own white, over the bent backdrop |

The conversions from Figma's 0–100 scale to points live in `FIGMA_GLASS` in
that file, and that is the place to retune it.

**The sky is a Skia canvas because of this.** A shader can only bend what it
is handed, so `Sky` in `HomeScreen.tsx` paints the gradient and the two cloud
plates in Skia, and paints the pill's glass into the same canvas at the pill's
frame. The `Glass` component in the scroll view draws nothing: it lays out the
gem and the count and reports its size, and the sky follows the scroll and the
greeting row's entrance on the UI thread so the two never separate.

Two mechanics underneath it:

- **It is a paint shader, not a backdrop filter.** A `BackdropFilter` would
  read the canvas for it, but Skia's web backend has no runtime-shader image
  filter at all (`RuntimeShaderBuilder: Not implemented on React Native Web`),
  so that build could never be checked anywhere but a device — which is how
  the earlier attempts shipped blind. A paint shader is handed its backdrop as
  child shaders instead: the same gradient, and the cloud plates as
  `ImageShader`s at the same rects the sky draws them at. That runs on iOS,
  Android and web alike, in points, with no pixel-density arithmetic.
- **Frost is baked.** A shader can no more blur an input than read the canvas,
  so `scripts/frost-cloud.js` writes a blurred copy of each plate
  (`cloud-main-frost.png`, `cloud-3-frost.png`), with the sigma converted from
  points to the plate's own pixels through the box it is drawn into. The
  gradient is smooth enough that blurring it would change nothing. Re-run it
  after re-exporting a plate or changing Frost.

Skia is pinned to an exact version, like `react-native-worklets`, because Expo
Go ships its native side: `2.6.2` is what `expo/bundledNativeModules.json`
lists for SDK 57.

On web Skia is CanvasKit, an 8MB WASM binary that has to be fetched before the
Skia API exists at all, so the root is wrapped in `WithSkiaWeb` — but in
`root.web.tsx`, not `index.ts`. Metro bundles every `require` it can see
whatever branch it sits in, so a `Platform.OS === 'web'` check around that
import still pulls CanvasKit into the iOS bundle, where its `import "fs"` fails
to resolve and Expo Go red-screens on launch. Platform files are the only way
to keep it out of the graph. Both halves are `.tsx` deliberately: Metro tries
every extension before every platform, so a `root.ts` would win over
`root.web.tsx` on web and load Skia before CanvasKit was in.

The binary is served from `public/`, which Expo copies to the web root, rather
than from a CDN — same-origin, so it works offline and behind a proxy, neither
of which a CDN does. It is generated rather than committed: `npm run web` runs
`npm run skia:web` first, and that is also the thing to re-run when Skia moves.

Strokes elsewhere on the screen are inset rings, not `borderWidth`: Figma's
"Inside" stroke paints over a frame without taking layout, while a border in
React Native eats into the content box. The streak card has no slack to give —
its 166 is exactly 10 + 88 + 6 + 56 + 6 — so a 1px border on each edge overflows
it by two and the week strip loses its bottom.

### Type is solved where the file was not readable

The node tree gives every text layer's box width. Each string was rendered in
Geist at a known size, measured in a browser, and the size scaled by the ratio
to the frame's width — so the sizes in `tokens.ts` carry the frame's own width
as a comment.

That caught a real error: "Welcome Back" at 24 runs 165 wide against the frame's
136, so the frame's is 20 and the first pass was a fifth too big. Most others
were within a point of right. The row's body copy is set a shade *larger* than
what exactly fills its 242, which is what truncates it at "and Sham…" the way
the frame does.

### Motion

One rule for the screen — everything fades up and lifts eight points on a 70ms
stagger down the page, and nothing scales, because scaling a band re-rasterises
the text inside it every frame and Home is mostly text. On top of that:

- Gems, the streak and the XP **count to their values** rather than appearing at
  them, easing out so the last digits crawl.
- The level track **fills**, and each cleared badge **stamps in as the fill
  reaches it**. The timings are derived from the geometry rather than typed in:
  a badge's turn is found by inverting the fill's cubic ease at its centre, so
  the two stay in step whatever the level is.
- The streak's struck-through days stamp in left to right, and today's dot
  breathes.
- The medal bobs and tilts on a long loop.
- Clouds travel at two rates against the scroll and drift on loops of their own
  — which is also what gives the frosted cards something worth blurring.
- Completing a quest pops its mark, washes green through the row and **drains
  again**, and bursts confetti from the mark itself, measured in window
  coordinates so the burst lands on the tick rather than near it. Clearing one
  does none of that: undo is a correction, and rewarding it teaches the wrong
  thing. The green is a beat rather than a state, because the frame draws a
  completed row exactly like the rest.

### Two places the frame is not followed

- **"3/5 completed" is counted, not transcribed.** The frame's label says 3/5
  while it draws checks on two of its five rows. That is a comp's placeholder
  rather than a spec, and a number that disagrees with the marks beside it is
  worse than one that moves, so it counts what is actually struck through — it
  reads 2/5 on open, and 3/5 once you tick one.
- **The level track's overshoot is kept.** The frame draws the filled segment
  running 25px past the third badge's centre rather than stopping on it. That
  reads as *in progress* rather than parked, so it is kept and derived from
  `reached`, which holds it true as the level moves.

Quests are tappable and the ring follows, but nothing here is persisted or wired
to `useProgress` — that tracks lessons, not quests or streaks. `src/data/home.ts`
is the frame's own state and the file to replace when there is a quest system
behind it. Its last two rows repeat the first row's copy, as the frame does.

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

## Striking a quest through

Nothing is ticked when the screen opens, and ticking is one way: the mark lands,
the row comes apart into dust, and the rows below rise into the gap it leaves.
There is no undo — a quest you did is done.

The dust is a Skia runtime shader (`components/home/dustShader.ts`) run over a
snapshot of the row, taken by `captureRef` the moment the mark lands, so what
blows away is the row you just completed rather than the row as it was before.
Expo Go for SDK 57 bundles `react-native-view-shot`, and on web it falls back to
html2canvas, so the same path runs on both — the web capture just takes about a
second where the native one takes tens of milliseconds.

It is a paint shader over that snapshot rather than a particle system: a system
would need a vertex per speck, tens of thousands of them rebuilt every frame,
where this is one quad and a fragment. The cost is that specks cannot be tracked
individually, so their motion is inferred — for a pixel, the shader works out
which speck would have landed there and samples the snapshot back along that
speck's path. Jittering neighbouring specks apart is what makes that sampling
read as grain rather than a smear. Three things then run at once: a ragged front
sweeps across, each cell winks out at its own moment, and specks shrink to dots
as they travel.

They also darken as they fly, which is the one liberty taken with the
snapshot's colour, and it is load-bearing. The reference this came from is a
bright card on black; a quest row is `F6FAFF` on a white sheet, so specks
carrying its fill are invisible unless they shade. What you see coming apart is
mostly the title, the sprite, the mark and the reward text — which is exactly
why the effect works off the snapshot rather than off the row's fill colour.

Two mechanics underneath it:

- **The canvas is over the whole screen, and always mounted.** Specks fly
  further than the row is tall, so a canvas sized to the row would have to
  escape its own bounds, which Android does not reliably allow. Always mounted
  because a Skia canvas sizes its surface from its first layout: one mounted
  mid-animation has none, paints once into nothing, and — since the flight is
  driven by shared values rather than state — never gets a second render to
  correct itself. The dust came out invisible that way with every value along
  the path correct.
- **It is wrapped in a plain `View` with `pointerEvents="none"`.** On the canvas
  alone, web keeps taking the taps and nothing in the list can be struck through
  at all.

`QuestRow` collapses its own slot rather than being unmounted on the spot, and
it does not start until the last speck has gone, then waits a beat longer.
Closing it under the dust puts two motions on top of each other in the same
place — the card coming apart, and the whole list sliding up through it — and
neither reads. Held back, the beats separate: the card turns to dust, the gap it
left sits open for a moment, and only then does the list close over it. The row
leaves the list when that gap finishes closing, not when the dust settles.

The three durations are all in `DUST` in `dustShader.ts`, so the whole sequence
retimes from one place. A row that will not snapshot skips straight to gone: the
dust is the flourish, not the mechanism.

## Node states

The frame draws three: a check on completed lessons, a play glyph on the one
you're up to, and a keyhole on the rest. Progress persists via AsyncStorage, and
the frame's starting state (two complete, the third current) is the seed.
