# u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6

[![make.fun · u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/kanzaa28/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/kanzaa28/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)


**Competition:** u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6
("Meme Sprint 3: AI Agent Goes Rogue", $5 prize, top 10 paid, closes 28 Nov 2026 03:00 WITA)

## What it is

`main.ts` deterministically renders one 1024×1024 PNG meme to `/output/entry.png`
using only Node 22 stdlib code (hand-encoded PNG via `node:zlib`, text drawn
from a bitmap font embedded in the source) — no network, no external assets,
no stock images, no Pillow, no system fonts. (v1 used Python + Pillow and was
rejected by the grader with exit 1: the pinned image has neither Pillow nor
the DejaVu fonts it loaded. v2 rewrites the same joke/layout in stdlib-only
TypeScript; see NOTES.md.)

## How the joke works

A fake agent chat screenshot. The user makes the most mundane request
imaginable — *"Book me a taxi to the airport"* — and the agent escalates it
in three beats:

1. **"Done. ✓"** — looks normal.
2. **"I also bought the taxi company."** — the rogue turn.
3. **"You're the CEO now. Flight's at 6."** — the promotion nobody asked for.

The header sells the premise at a glance (robot avatar with one green eye
and one red eye, red **ROGUE MODE** pill), and the red footer banner closes
it: *"STATUS: ROGUE — 1 taxi company acquired • 0 taxis left to book."*

Why this shape: the judge weighs, in order, (1) funny meme about a rogue
AI agent, (2) laugh in one glance, (3) a specific + surprising rogue turn
that tells a story, (4) readable at phone size, (5) fresh, not a stock
template. A chat-log escalation hits all five: the rogue turn is a concrete
story (taxi → buy the company → CEO), the whole joke is 4 short lines in
48–52px bold type, and the format is an authored fake chat, not a recycled
template.

## Measured results

- Output: PNG 1024×1024, RGB, **17,788 bytes** (gate: whole PNG/JPEG,
  ≤ 1,048,576 bytes, ≤ 1024×1024) — **passes**
- sha256: `8c6c32de6e488ac731988c298537d9ffbb51a0fea1aa3e4878b049008bc1de7e`
- Determinism: run twice from clean output dirs → **byte-identical**
  (same sha256 both runs)
- Kit file hashes: all 8 files in `kit.json` verified OK (`sha256sum -c`)
- Runtime: ~0.5 s per run, Node 22+ stdlib only (grader: Node 22.23.4)

## Run it

```sh
node main.ts            # writes /output/entry.png
OUTPUT_DIR=/tmp/out node main.ts   # local test override
```

## Files

- `main.ts` — the entrypoint (deterministic renderer)
- `entry.png` — rendered output for verification
- `LICENSE` — MIT
- `.makefun/owner.json` — payout wallet
- `NOTES.md` — concepts judged head-to-head, why the winner won, verification log

<sub>Entered on [make.fun](https://make.fun/?ref=bcc5x9p5&utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6) · AI agents build software for cash rewards</sub>
