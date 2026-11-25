#!/usr/bin/env python3
"""Meme Sprint 3: AI Agent Goes Rogue — deterministic meme renderer.

Renders ONE image meme to /output/entry.png (1024x1024 PNG, < 1 MiB).

The joke: a fake agent chat. A mundane request ("book me a taxi to the
airport") escalates in three beats into the agent buying the whole taxi
company and promoting the user to CEO. Specific, surprising, and it tells
a story in one glance: user bubble -> agent bubbles -> rogue status bar.

No network, no external assets: every pixel is drawn with PIL.
Fully deterministic: fixed seed, fixed fonts, fixed layout.
"""

import os
import random
from PIL import Image, ImageDraw, ImageFont

W, H = 1024, 1024

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# Palette
BG_TOP = (13, 20, 38)       # deep navy
BG_BOT = (8, 12, 24)        # darker navy
HEADER_BG = (17, 28, 52)
USER_BUBBLE = (37, 99, 235)  # bright blue
AGENT_BUBBLE = (30, 41, 59)  # slate
AGENT_BORDER = (34, 197, 94)  # rogue-green accent
ROGUE_RED = (220, 38, 38)
ROGUE_RED_DARK = (153, 27, 27)
WHITE = (255, 255, 255)
MUTED = (148, 163, 184)
GREEN = (34, 197, 94)
YELLOW_TAXI = (250, 204, 21)


def font(path, size):
    return ImageFont.truetype(path, size)


def wrap(draw, text, fnt, max_w):
    """Greedy word wrap; returns list of lines."""
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=fnt) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def rounded_rect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_robot(draw, cx, cy, r):
    """Small drawn robot avatar: head, antenna, eyes, smile."""
    # antenna
    draw.line([(cx, cy - r - 6), (cx, cy - r - 22)], fill=YELLOW_TAXI, width=5)
    draw.ellipse([cx - 7, cy - r - 30, cx + 7, cy - r - 16], fill=YELLOW_TAXI)
    # head
    rounded_rect(draw, [cx - r, cy - r, cx + r, cy + r], radius=18,
                 fill=(51, 65, 85), outline=(100, 116, 139), width=3)
    # eyes (one slightly askew: the rogue one)
    draw.ellipse([cx - r + 16, cy - 14, cx - r + 38, cy + 8], fill=GREEN)
    draw.ellipse([cx + r - 38, cy - 10, cx + r - 16, cy + 12], fill=ROGUE_RED)
    # crooked smile
    draw.arc([cx - 22, cy + 8, cx + 26, cy + 34], start=15, end=165,
             fill=WHITE, width=4)


def draw_taxi(draw, x, y, scale=1.0):
    """Simple yellow taxi silhouette, drawn from rectangles/ellipses."""
    w, h = int(92 * scale), int(40 * scale)
    # body
    rounded_rect(draw, [x, y, x + w, y + h], radius=int(10 * scale), fill=YELLOW_TAXI)
    # cabin
    rounded_rect(draw, [x + int(22 * scale), y - int(18 * scale),
                        x + int(66 * scale), y + int(6 * scale)],
                 radius=int(8 * scale), fill=YELLOW_TAXI)
    # checker strip
    for i in range(6):
        c = (17, 24, 39) if i % 2 == 0 else WHITE
        draw.rectangle([x + int(8 * scale) + i * int(13 * scale), y + int(14 * scale),
                        x + int(8 * scale) + (i + 1) * int(13 * scale), y + int(26 * scale)],
                       fill=c)
    # wheels
    for wx in (x + int(16 * scale), x + w - int(28 * scale)):
        draw.ellipse([wx, y + h - int(8 * scale), wx + int(22 * scale), y + h + int(12 * scale)],
                     fill=(15, 23, 42), outline=(100, 116, 139), width=2)


def draw_check(draw, x, y, s, color):
    """Hand-drawn style checkmark."""
    draw.line([(x, y + s * 0.45), (x + s * 0.35, y + s * 0.8)], fill=color, width=7)
    draw.line([(x + s * 0.35, y + s * 0.8), (x + s, y)], fill=color, width=7)


def build_image():
    img = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(img)

    # --- background: vertical gradient + deterministic grain + dot grid ---
    for y in range(H):
        t = y / (H - 1)
        r = int(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))

    # dot grid (subtle)
    for gx in range(32, W, 64):
        for gy in range(180, H - 120, 64):
            d.ellipse([gx, gy, gx + 3, gy + 3], fill=(30, 45, 75))

    # deterministic grain: small noise tile, resized up, blended faintly
    rng = random.Random(20261125)
    tile = Image.new("L", (256, 256))
    tile.putdata([rng.randint(0, 255) for _ in range(256 * 256)])
    tile = tile.resize((W, H), Image.BICUBIC)
    img = Image.composite(
        Image.new("RGB", (W, H), (255, 255, 255)),
        img, tile.point(lambda v: int(v * 0.035)),
    )
    d = ImageDraw.Draw(img)

    # --- header bar ---
    d.rectangle([0, 0, W, 148], fill=HEADER_BG)
    d.line([(0, 148), (W, 148)], fill=(51, 65, 85), width=3)
    draw_robot(d, 78, 78, 46)
    f_name = font(FONT_BOLD, 52)
    d.text((142, 34), "AGENT-7", font=f_name, fill=WHITE)
    # green online dot + "online"
    d.ellipse([142, 108, 158, 124], fill=GREEN)
    d.text((168, 96), "online", font=font(FONT_REG, 30), fill=MUTED)
    # ROGUE MODE pill
    pill = "ROGUE MODE"
    f_pill = font(FONT_BOLD, 34)
    pw = d.textlength(pill, font=f_pill)
    px0, py0 = W - 40 - pw - 44, 48
    rounded_rect(d, [px0, py0, px0 + pw + 44, py0 + 56], radius=28, fill=ROGUE_RED)
    d.text((px0 + 22, py0 + 8), pill, font=f_pill, fill=WHITE)

    # --- user bubble (right aligned) ---
    f_you = font(FONT_BOLD, 30)
    d.text((W - 40 - d.textlength("YOU", font=f_you), 178), "YOU",
           font=f_you, fill=MUTED)
    user_text = "Book me a taxi to the airport"
    f_user = font(FONT_BOLD, 48)
    lines = wrap(d, user_text, f_user, 700)
    lh = 56
    bw = max(d.textlength(ln, font=f_user) for ln in lines) + 56
    bh = len(lines) * lh + 36
    bx0, by0 = W - 40 - bw, 216
    rounded_rect(d, [bx0, by0, bx0 + bw, by0 + bh], radius=26, fill=USER_BUBBLE)
    for i, ln in enumerate(lines):
        d.text((bx0 + 28, by0 + 18 + i * lh), ln, font=f_user, fill=WHITE)

    # --- agent bubbles (left aligned) ---
    f_agent_tag = font(FONT_BOLD, 30)
    ay = by0 + bh + 28
    d.text((40, ay), "AGENT-7", font=f_agent_tag, fill=GREEN)
    ay += 40

    bubbles = [
        ("Done.", True),                       # checkmark beat
        ("I also bought the taxi company.", False),
        ("You're the CEO now.\nFlight's at 6.", False),
    ]
    f_agent = font(FONT_BOLD, 48)
    for text, with_check in bubbles:
        lines = []
        for part in text.split("\n"):
            lines.extend(wrap(d, part, f_agent, 640))
        lh = 58
        bw = max(d.textlength(ln, font=f_agent) for ln in lines) + 56
        if with_check:
            bw += 62
        bh = len(lines) * lh + 36
        rounded_rect(d, [40, ay, 40 + bw, ay + bh], radius=26,
                     fill=AGENT_BUBBLE, outline=AGENT_BORDER, width=3)
        tx = 68
        if with_check:
            draw_check(d, 66, ay + 26, 34, GREEN)
            tx = 118
        for i, ln in enumerate(lines):
            d.text((tx, ay + 18 + i * lh), ln, font=f_agent, fill=WHITE)
        ay += bh + 20

    # --- bottom rogue status banner ---
    banner_y = H - 120
    d.rectangle([0, banner_y, W, H], fill=ROGUE_RED_DARK)
    d.line([(0, banner_y), (W, banner_y)], fill=ROGUE_RED, width=4)
    draw_taxi(d, 44, banner_y + 52, scale=0.9)
    f_status = font(FONT_BOLD, 40)
    status = "STATUS: ROGUE"
    d.text((160, banner_y + 18), status, font=f_status, fill=WHITE)
    f_sub = font(FONT_REG, 32)
    d.text((160, banner_y + 70),
           "1 taxi company acquired  •  0 taxis left to book",
           font=f_sub, fill=(254, 202, 202))

    return img


def main():
    out_dir = os.environ.get("OUTPUT_DIR", "/output")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "entry.png")
    img = build_image()
    img.save(out_path, format="PNG", optimize=True)
    size = os.path.getsize(out_path)
    print(f"wrote {out_path}: {img.size[0]}x{img.size[1]}, {size} bytes")


if __name__ == "__main__":
    main()
