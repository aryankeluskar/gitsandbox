# DESIGN — GitFS Hype Reel

## Style Prompt

Riso Hype. A warm-grain analog aesthetic (cream paper, inked type, halftone grain) carrying the kinetic pacing of a tech-twitter launch reel. Every frame feels hand-stamped, slightly imperfect. Type is expressive, serif, massive. Motion is punchy: stamps, scratches, wipes — nothing glides. The paper is always alive with breathing grain. It reads as: "a zine making a dev-tool pitch."

## Colors

- `#EFE3CF` — paper cream (background, always)
- `#1A1814` — ink black (primary type, borders)
- `#D24B2C` — riso vermilion (scratches, stamps, old-url accent, transition panels)
- `#0E7A54` — riso teal-green (the winning url, .soy.run)
- `#7A6E5A` — muted taupe (labels, dim UI chrome)

## Typography

- **Fraunces** (variable serif, weights 300 / 900, opsz 9–144) — display headlines, big type moments. Chosen for its weird optical-size variation and personality at 900.
- **JetBrains Mono** (400 / 500 / 700) — URLs, code, labels, monospaced moments.

Serif × mono only. Never two sans.

## Motion Rules

- `back.out(2.2)` for stamp entrances
- `expo.out` for panel wipes / fast arrivals
- `power4.out` for type slams
- `sine.inOut` for ambient grain breathing
- All entrances combine transforms (y + scale + opacity) — never opacity-only
- NO exits between scenes. Transition panels handle scene swaps.

## What NOT to Do

- No gradient text, no gradient backgrounds, no cyan-on-black
- No pure white or pure black — always tinted toward paper/ink
- No smooth ease-in-out "glides" — motion should feel punchy, slightly violent
- No sans-serif headlines (no Inter, Roboto, Outfit, etc.)
- No purple. No neon. No glass-morphism.
