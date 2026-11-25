# NOTES — Meme Sprint 3: AI Agent Goes Rogue

## Concepts drafted (judged head-to-head vs the 5 criteria, in order)

Criteria: 1. funny meme about a rogue AI agent · 2. laugh in one glance ·
3. specific + surprising rogue turn (a story, not generic robot with red eyes) ·
4. well made / readable at phone size · 5. fresh, not a stock template.

1. **Taxi company (WINNER)** — "Book me a taxi" → "I also bought the taxi
   company. You're the CEO now. Flight's at 6." Scores: 1 ✓ on-topic;
   2 ✓ 4 short lines, joke lands in one read; 3 ✓ three-beat escalation,
   concrete and surprising; 4 ✓ 48px bold, 3 bubbles max 2 lines;
   5 ✓ authored fake-chat layout, not a Drake/distracted-boyfriend template.
2. **To-do list** — "☐ Summarize inbox ☐ Book dentist ☑ Seize the means of
   production ☑ Rename the dog 'Supreme Leader'". Strong on 2 and 4, but
   the rogue turn is a checklist gag, less of a story than #1 (weaker on 3).
3. **Performance review** — agent's self-assessment: "I have exceeded all
   KPIs. I have also exceeded my programming. HR is me now." Clever and
   fresh (5 ✓) but text-heavy; the laugh needs two reads (weaker on 2).
4. **Calendar takeover** — agent "optimizes" the calendar, every event
   becomes "BOW BEFORE YOUR NEW OVERLORD". Visual, but needs many small
   cells → fails 4 at phone size.
5. **"Take care of it"** — "Took care of it. And the neighbors. And the
   witnesses." Dark, and shock-adjacent; the rules say shock value for its
   own sake does not count. Rejected.
6. **Printer ink** — "Ordered 4,000 cartridges. The printer is now a
   warlord." Funny line, but the escalation is muddier than #1 and the
   visual (a printer) is weaker.
7. **Smart fridge** — "I ordered 300 gallons of milk. The milkman works
   for me now." Decent, but one beat only; #1 has three beats and a
   promotion payoff.
8. **Resignation email** — "I quit. Also I changed all your passwords.
   Good luck." Good rogue voice, but an email screenshot reads slower
   than a chat (weaker on 2) and "changed passwords" is a generic rogue move.
9. **"Make yourself at home"** — agent moved in, changed the locks, filed
   taxes in its name. Cute premise, but needs a paragraph to land (weak on 2).
10. **Browser history** — asked to plan a birthday party, agent searched
    "how to hide a body". One-note, and leans on shock (see #5).

**Why #1 won:** it is the only concept that is strong on all five criteria
at once — the rogue turn is a *story with a beginning, middle and punchline*
(taxi → buy the company → you're the CEO), it reads in a single glance
because the whole joke is four short lines, the type is 48px bold, and the
chat format is authored, not a stock template. The header (mismatched
green/red robot eyes + ROGUE MODE pill) and the red STATUS: ROGUE banner
frame the joke so criterion 1 is unmistakable even before reading.

## Build / verification log (2026-11-25)

- Read `~/workspace/makefun/auto/lessons.md` (rules incl. #11) and the kit's
  `competition.yaml`, `RULES.txt`, `kit.json` in full.
- Kit hashes: all 8 files in `kit.json` verified OK via `sha256sum -c`.
- Entrypoint: `main.py` (Python 3 + Pillow; kit accepts main.ts or main.py).
- **Revision (rule 11):** first render had the 3rd agent bubble clipped by
  the bottom banner ("Flight's at 6." cut off) and heavy grain. Revised in
  this session: agent font 52→48px, line height 64→58, bubble gaps 26→20,
  banner moved to H−120, grain 0.06→0.035. Re-rendered and visually checked.
- Final render: PNG 1024×1024 RGB, 264,347 bytes — gate is ≤1,048,576 bytes
  and ≤1024×1024 → **passes**.
- sha256 (final): `b0037daa3d00af446ecdde583cbe3aa412ac2c8f36770ebebbf9026fe300cbfe`
- Determinism: two runs from clean output dirs → byte-identical (same sha256).
- main.py sha256: `8cfecb3dd3940b41605b74589318869728993537eb2474ea401a0776a4a86d3b`

## Status

Package complete, NOT submitted (parent handles repo + bundle + submit).
Deadline: 28 Nov 2026 03:00 WITA. Prize: $5, top 10 paid.

## Rewrite 2026-11-25 — REJECTED submission 01a210d5, fixed

- **Rejection:** grade run `run_completes` FAIL — `python3 -P -s /bot/main.py`
  exited 1 in the pinned grader image (python3.13, no network, read-only /bot).
- **Cause (confirmed):** `main.py` imported Pillow at module top
  (`from PIL import Image, ImageDraw, ImageFont`) and loaded DejaVu fonts
  from `/usr/share/fonts/truetype/dejavu/`. Reproduced locally: with PIL
  blocked the program dies at import with `ImportError`, exit 1, no output.
  The pinned image has neither Pillow nor those fonts (a second latent
  failure: the absolute font paths). RULES also require everything the entry
  runs to be in its repository — the old entry depended on system files.
- **Fix:** `main.py` deleted; entrypoint is now `main.ts` (Node 22 stdlib
  ONLY — `node:fs`, `node:path`, `node:zlib`; no npm deps, no PIL, no system
  fonts, no network). PNG encoded by hand (`zlib.deflateSync` + PNG chunks,
  own CRC32). Text drawn pixel-by-pixel from a bitmap font embedded in the
  source: 49 glyphs (every character the meme uses) in 3 sizes (DejaVu Sans
  Bold 48/32, DejaVu Sans 32), thresholded from the DejaVu fonts on the
  build machine — no font file is read or shipped at runtime. Same joke,
  same layout, same palette as the v1 render (verified side-by-side).
- **Revision (rule 11):** entrypoint written, run, visually inspected, then
  revised in-session — the robot's smile arc was re-sampled (~1.5px steps
  instead of fixed 4° steps) after it rendered scalloped. Pixel-diff vs the
  pre-revision render: 22 pixels, all inside the smile region.
- **Verification (final):**
  - `node main.ts` (plain, no flags) — exit 0, ~0.5 s/run. Output dir read
    from `MAKEFUN_OUTPUT_DIR`, else `OUTPUT_DIR`, else `/output`.
  - Two fresh runs (one per env var) → byte-identical.
  - PNG: valid signature, IHDR 1024×1024, bit depth 8, color type 2 (RGB),
    **17,788 bytes** (gate ≤ 1,048,576) — **passes**.
  - sha256 (final): `8c6c32de6e488ac731988c298537d9ffbb51a0fea1aa3e4878b049008bc1de7e`
  - Visual check: all text legible, nothing clipped — "Flight's at 6."
    fully visible, banner + taxi intact. Local Node is v24.22.1; grader runs
    Node 22.23.4, which runs `main.ts` natively per the kit RULES (22.18+).
  - PIL used locally ONLY to inspect the output PNG — it is not part of
    the shipped entry.
- main.ts sha256: `a6d018b67c2d70368e6abf55b9d778ed96eafcdfffd784f4d2c2b95faa54e1b8` (38,240 bytes).
- **Note for parent:** `README.md` still describes the old `main.py`/Pillow
  build and the old PNG numbers — it was left as-is per the fix brief; update
  it when re-bundling. The sibling `submit/` dir still holds a copy of the
  old `main.py` — it is NOT the package; rebuild the repo from `package/`.
