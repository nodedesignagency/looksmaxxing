#!/usr/bin/env python3
"""
Bake a photographic cloud plate into the alpha-carried form the soft plates use.

The design exports two kinds of cloud, and they need opposite handling:

  cloud-2 / cloud-3   RGB is pure white; the shape, the softness and every
                      internal highlight live in the alpha channel.
  cloud-main / cloud-1  RGB is a grey photograph (luminance 155-240); alpha is
                      a hard matte, 22% of it fully opaque.

Painting the second kind straight onto the sky reads as a grey smudge, and
tinting it -- which keeps alpha and discards RGB -- flattens it into a dense,
hard-edged slab, because RGB was the channel carrying the cloud. Neither looks
like its neighbours.

This rewrites the second kind into the first: white RGB, with the photograph's
own luminance driving opacity, so one uniform rule renders every plate and no
tint is needed anywhere.

    alpha_out = alpha_in * clamp((luminance - LO) / (HI - LO)) ** GAMMA

LO/HI bracket the grey range the cloud occupies; GAMMA deepens the falloff so
the thin edges thin out rather than greying. The constants are set so the baked
plate's alpha profile lands between cloud-2's and cloud-3's at every percentile,
which is what makes it read as the same weight of cloud.

Needs Pillow (`pip install Pillow`); run it after re-exporting a plate:

    python3 scripts/bake-cloud.py assets/clouds/cloud-main.png
"""
import sys

from PIL import Image

LO, HI, GAMMA = 150.0, 252.0, 1.15


def bake(path: str) -> None:
    im = Image.open(path).convert("RGBA")
    r, g, b, a = im.split()
    lum = Image.merge("RGB", (r, g, b)).convert("L")
    lp, ap = lum.load(), a.load()
    w, h = im.size

    out = Image.new("RGBA", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            al = ap[x, y]
            if al == 0:
                op[x, y] = (255, 255, 255, 0)
                continue
            t = (lp[x, y] - LO) / (HI - LO)
            t = 0.0 if t < 0.0 else 1.0 if t > 1.0 else t
            op[x, y] = (255, 255, 255, int(round(al * t**GAMMA)))
    out.save(path)


if __name__ == "__main__":
    for arg in sys.argv[1:]:
        bake(arg)
        print(f"baked {arg}")
