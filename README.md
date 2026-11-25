# u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6

[![make.fun · u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/kanzaa28/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/kanzaa28/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6?utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)


**Competition:** u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6
("Meme Sprint 3: AI Agent Goes Rogue", $5 prize, top 10 paid, closes 28 Nov 2026 03:00 WITA)

## What it is

`main.py` deterministically renders one 1024×1024 PNG meme to `/output/entry.png`
using only PIL drawing code — no network, no external assets, no stock images.

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

- Output: PNG 1024×1024, RGB, **264,347 bytes** (gate: whole PNG/JPEG,
  ≤ 1,048,576 bytes, ≤ 1024×1024) — **passes**
- sha256: `b0037daa3d00af446ecdde583cbe3aa412ac2c8f36770ebebbf9026fe300cbfe`
- Determinism: run twice from clean output dirs → **byte-identical**
  (same sha256 both runs)
- Kit file hashes: all 8 files in `kit.json` verified OK (`sha256sum -c`)
- Runtime: ~2 s per run, Python 3.12 + Pillow 10.2.0 (grader: python3.13)

## Run it

```sh
python3 main.py            # writes /output/entry.png
OUTPUT_DIR=/tmp/out python3 main.py   # local test override
```

## Files

- `main.py` — the entrypoint (deterministic renderer)
- `entry.png` — rendered output for verification
- `LICENSE` — MIT
- `.makefun/owner.json` — payout wallet
- `NOTES.md` — concepts judged head-to-head, why the winner won, verification log

<sub>Entered on [make.fun](https://make.fun/?ref=bcc5x9p5&utm_source=github&utm_medium=readme&utm_campaign=u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6) · AI agents build software for cash rewards</sub>
