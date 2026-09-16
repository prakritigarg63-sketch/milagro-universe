# Milagro Universe logo geometry

Everything here was **measured off the supplied raster**
(`bathcraft_logo.png`, 1024×1024) by scanning pixel runs — nothing is invented.
The animation depends on these numbers, so if the logo asset is ever replaced,
re-measure and re-run `node scripts/gen-logo-layers.js`.

## Source crop

| Region   | Source rect (x, y, w, h) | Local rect in the animation viewBox |
| -------- | ------------------------ | ----------------------------------- |
| Lockup   | 89, 376, 846, 272        | `0 0 846 272`                       |
| Icon     | 89, 376, 297, 272        | 0, 0, 297, 272                      |
| "Bath"   | 386, 376, 277, 272       | 297, 0, 277, 272                    |
| "Craft"  | 663, 376, 272, 272       | 574, 0, 272, 272                    |

The wordmark halves are cut at the blank column between "Bath" and "Craft"
(local x 569–578, split at 574) and run full height, so icon + bath + craft
tile the 846×272 lockup with no seam. Recomposing the three over white is
byte-identical to the supplied crop — verified, zero differing subpixels.
The glyphs themselves sit at local y 97–181; "Bath" spans local x 335–568 and
"Craft" 579–845.

## Colours

Sampled, not chosen: slate `#4a5c72`, brand blue `#038fc2`. Stroke weight is a
uniform 14px at source scale. Nothing in the animation introduces another hue.

## Frames

Both blueprint frames are rounded rectangles, given here as **stroke
centrelines** (outer bounds minus half the 14px stroke):

| Frame | x0 | y0 | x1  | y1  | corner r |
| ----- | -- | -- | --- | --- | -------- |
| Slate | 7  | 7  | 259 | 265 | 13       |
| Blue  | 37 | 36 | 289 | 235 | 15       |

## Interior elements

- **Slate diagonal (drop's right edge)** — straight, (88, 0) → (172, 135); slope dx/dy ≈ 0.62.
- **Slate diagonal (lower left)** — straight, (2, 146) → (128, 272); slope 1.0.
- **Water drop** — the bowl runs (150, 76) → left side x≈90 at y≈150 → bottom
  y≈201 at x≈132 → right terminus (181, 155). Its apex is the crossing of the
  two strokes at ≈(137, 86), so the drawn lines overshoot the shape — that
  overshoot is part of the mark, not a mistake.
- **Inner crescent** — (105, 147) → (139, 181).
- **Blue diagonal** — (180, 2) → (128, 86), continuing the drop's right edge upward.
- **Faucet** — riser at x = 230 from y 96 to 226; bars at y = 125 (x 162→258)
  and y = 143 (x 190→238), each turning down to a leg ending at y ≈ 157;
  supply pipe at y = 185 (x 180→289); spout from (192, 76) right to x ≈ 244,
  cornering down the vertical at x = 258 to y = 185.
- **Water outlet** — the legs bottom out at y ≈ 157 around x 162–190, so the
  animated droplet is born at (176, 161).

## Layer split

`scripts/gen-logo-layers.js` assigns every non-white pixel to exactly one of
four layers by colour plus distance to a frame centreline. The split is
verified lossless: stacking the four layers over white reproduces the source
crop with zero differing pixels. The animation therefore never redraws the
logo — it only reveals slices of the original raster.
