import sys
import os
import math
import random
from pathlib import Path
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_MP4 = OUTPUT_DIR / "labelless_interactive_walkthrough.mp4"
ROOT_MP4 = PROJECT_ROOT / "labelless_interactive_walkthrough.mp4"

WIDTH, HEIGHT = 1920, 1080
FPS = 30

# Font Setup
FONT_DIR = Path("C:/Windows/Fonts")
FONT_TITLE = ImageFont.truetype(str(FONT_DIR / "segoeuib.ttf"), 34)
FONT_SUBTITLE = ImageFont.truetype(str(FONT_DIR / "segoeui.ttf"), 20)
FONT_HEADING = ImageFont.truetype(str(FONT_DIR / "segoeuib.ttf"), 26)
FONT_BODY = ImageFont.truetype(str(FONT_DIR / "segoeui.ttf"), 22)
FONT_BOLD = ImageFont.truetype(str(FONT_DIR / "segoeuib.ttf"), 22)
FONT_MONO = ImageFont.truetype(str(FONT_DIR / "consolab.ttf"), 20)
FONT_MONO_LARGE = ImageFont.truetype(str(FONT_DIR / "consolab.ttf"), 30)
FONT_BADGE = ImageFont.truetype(str(FONT_DIR / "consolab.ttf"), 16)
FONT_LABEL = ImageFont.truetype(str(FONT_DIR / "segoeui.ttf"), 16)

# Colors
BG_DARK = (10, 12, 18)
CARD_BG = (22, 24, 33)
CARD_BORDER = (45, 48, 65)
BLUE_ACCENT = (59, 130, 246)
EMERALD_GREEN = (16, 185, 129)
ROSE_RED = (244, 63, 94)
AMBER_YELLOW = (245, 158, 11)
PURPLE_ACCENT = (168, 85, 247)
TEXT_WHITE = (255, 255, 255)
TEXT_GRAY = (180, 185, 205)
TEXT_MUTED = (120, 125, 145)


def ease_in_out(t):
    """Smooth cubic ease in-out interpolation."""
    return t * t * (3.0 - 2.0 * t)


def draw_cursor(draw, x, y, is_clicking=False, click_radius=0):
    """Draw a modern OS cursor with shadow and click ripple."""
    if is_clicking and click_radius > 0:
        draw.ellipse(
            [(x - click_radius, y - click_radius), (x + click_radius, y + click_radius)],
            outline=(59, 130, 246, 180),
            width=3,
        )

    # Cursor arrow polygon
    pts = [
        (x, y),
        (x, y + 24),
        (x + 6, y + 18),
        (x + 14, y + 25),
        (x + 18, y + 21),
        (x + 10, y + 14),
        (x + 19, y + 14),
    ]
    # Shadow
    shadow_pts = [(px + 2, py + 2) for px, py in pts]
    draw.polygon(shadow_pts, fill=(0, 0, 0, 160))
    # Main White pointer
    draw.polygon(pts, fill=(255, 255, 255), outline=(15, 15, 20))


def add_hud_bar(frame: Image.Image, step_num: str, title: str, subtitle: str, badge_col: tuple, progress: float):
    """Render cinematic lower-third commentary bar."""
    draw = ImageDraw.Draw(frame)
    box_y1, box_y2 = 915, 1045
    box_x1, box_x2 = 60, 1860

    # Glassmorphism container
    draw.rounded_rectangle([(box_x1, box_y1), (box_x2, box_y2)], radius=16, fill=(12, 14, 22), outline=(50, 55, 75), width=2)
    
    # Step badge
    draw.rounded_rectangle([(box_x1 + 25, box_y1 + 22), (box_x1 + 190, box_y1 + 58)], radius=8, fill=badge_col)
    draw.text((box_x1 + 38, box_y1 + 28), step_num, font=FONT_BADGE, fill=(10, 15, 20))

    # Title & Subtitle
    draw.text((box_x1 + 210, box_y1 + 20), title, font=FONT_TITLE, fill=TEXT_WHITE)
    draw.text((box_x1 + 210, box_y1 + 72), subtitle, font=FONT_SUBTITLE, fill=TEXT_GRAY)

    # Progress bar inside HUD
    p_width = int((box_x2 - box_x1 - 50) * progress)
    draw.rectangle([(box_x1 + 25, box_y2 - 10), (box_x2 - 25, box_y2 - 6)], fill=(30, 35, 48))
    draw.rectangle([(box_x1 + 25, box_y2 - 10), (box_x1 + 25 + p_width, box_y2 - 6)], fill=BLUE_ACCENT)


def main():
    print("🎬 Generating LabelLess AI Interactive Walkthrough Video (1920x1080 @ 30 FPS)...")

    # Load captured live website screenshots
    sc_dash = Image.open(OUTPUT_DIR / "cap_dashboard.png").convert("RGB")
    sc_queue = Image.open(OUTPUT_DIR / "cap_queue.png").convert("RGB")
    sc_workspace = Image.open(OUTPUT_DIR / "cap_workspace.png").convert("RGB")
    sc_evolution = Image.open(OUTPUT_DIR / "cap_evolution.png").convert("RGB")
    sc_export = Image.open(OUTPUT_DIR / "cap_export.png").convert("RGB")

    # Load disaster aerial image for workspace canvas
    disaster_img = Image.open(PROJECT_ROOT / "public/predictions/00f205aea57febc8e82d4e99a18b1d51.png").convert("RGB")

    # Video specs: 70 seconds total = 2,100 frames
    # Part 1: Dashboard Overview & Priority Queue Selection (0 - 14s / 420 frames)
    # Part 2: Smart Review Queue & Explain AI Modal (14 - 28s / 420 frames)
    # Part 3: Live Issue Resolution in Annotation Studio (28 - 48s / 600 frames)
    # Part 4: Retraining Loop Trigger & Model Elevation (48 - 60s / 360 frames)
    # Part 5: Exporting Production Weights & Summary (60 - 70s / 300 frames)
    total_frames = 2100

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(OUTPUT_MP4), fourcc, float(FPS), (WIDTH, HEIGHT))

    if not out.isOpened():
        print("❌ Error: Could not open OpenCV VideoWriter.")
        sys.exit(1)

    # Confetti particle pool for celebration moment
    confetti_particles = [
        {
            "x": random.randint(400, 1500),
            "y": random.randint(300, 800),
            "vx": random.uniform(-6, 6),
            "vy": random.uniform(-10, -2),
            "color": random.choice([(16, 185, 129), (59, 130, 246), (245, 158, 11), (244, 63, 94), (168, 85, 247)]),
            "size": random.randint(6, 12),
        }
        for _ in range(80)
    ]

    print("🎥 Rendering interactive walkthrough frames...")

    for frame_idx in range(total_frames):
        t_sec = frame_idx / FPS

        # ---------------------------------------------------------------------
        # PART 1: DASHBOARD OVERVIEW & QUEUE SELECTION (0s - 14s)
        # ---------------------------------------------------------------------
        if frame_idx < 420:
            p = frame_idx / 420.0
            frame = sc_dash.copy()
            draw = ImageDraw.Draw(frame)

            # Cursor movement: from navbar down to the high priority review queue table
            if p < 0.4:
                # Hovering over 73.7% auto-label bar
                cp = ease_in_out(p / 0.4)
                cx = int(400 + cp * 400)
                cy = int(180 + cp * 180)
                draw_cursor(draw, cx, cy)
            elif p < 0.75:
                # Moving down to first item in the high priority table
                cp = ease_in_out((p - 0.4) / 0.35)
                cx = int(800 + cp * 750)
                cy = int(360 + cp * 360)
                draw_cursor(draw, cx, cy)
            else:
                # Clicking the "Annotate →" button
                cx, cy = 1550, 720
                click_p = (p - 0.75) / 0.25
                draw_cursor(draw, cx, cy, is_clicking=True, click_radius=int(click_p * 28))
                
                # Highlight click rectangle around row
                draw.rounded_rectangle([(440, 680), (1600, 760)], radius=8, outline=BLUE_ACCENT, width=3)

            add_hud_bar(
                frame,
                "STEP 01 / DASHBOARD",
                "Ingestion Overview & Priority Triage",
                "73.7% of pool is auto-labeled. Selecting #0001 (Critical Uncertainty: 0.94) from queue.",
                EMERALD_GREEN,
                p,
            )

        # ---------------------------------------------------------------------
        # PART 2: SMART REVIEW QUEUE & EXPLAIN DECISION MODAL (14s - 28s)
        # ---------------------------------------------------------------------
        elif frame_idx < 840:
            p = (frame_idx - 420) / 420.0
            frame = sc_queue.copy()
            draw = ImageDraw.Draw(frame)

            # Cursor moves to "Explain AI Decision" button and clicks it
            if p < 0.25:
                cp = ease_in_out(p / 0.25)
                cx = int(1550 - cp * 350)
                cy = int(720 - cp * 300)
                draw_cursor(draw, cx, cy)
            elif p < 0.75:
                # Explain Modal is OPEN on screen
                modal_p = (p - 0.25) / 0.5
                # Darken background
                overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 180))
                frame.paste(overlay, (0, 0), mask=overlay)

                # Centered Modal Window
                mx1, my1, mx2, my2 = 480, 200, 1440, 820
                draw.rounded_rectangle([(mx1, my1), (mx2, my2)], radius=24, fill=(18, 20, 30), outline=BLUE_ACCENT, width=3)
                
                # Modal Header
                draw.text((mx1 + 40, my1 + 35), "🔍 Active Learning Diagnostic: Image #0001", font=FONT_HEADING, fill=TEXT_WHITE)
                draw.text((mx1 + 40, my1 + 75), "Why did the YOLOv8 model request human intervention?", font=FONT_SUBTITLE, fill=TEXT_GRAY)
                draw.line([(mx1 + 40, my1 + 115), (mx2 - 40, my1 + 115)], fill=(45, 50, 70), width=1)

                # 3 Key Factor Breakdown Rows
                factors = [
                    ("Model Uncertainty (High Entropy)", "68%", "Confidence is only 52% on complex collapsed structure", AMBER_YELLOW),
                    ("Rare Class Representation (Fire/Debris)", "22%", "Damaged Building is underrepresented in initial seed", ROSE_RED),
                    ("Novel Spatial Embedding", "10%", "High feature distance from previous training rounds", BLUE_ACCENT),
                ]
                for f_idx, (f_name, f_pct, f_desc, f_col) in enumerate(factors):
                    fy = my1 + 140 + f_idx * 110
                    draw.text((mx1 + 40, fy), f_name, font=FONT_BOLD, fill=TEXT_WHITE)
                    draw.text((mx2 - 120, fy), f_pct, font=FONT_MONO_LARGE, fill=f_col)
                    draw.text((mx1 + 40, fy + 32), f_desc, font=FONT_LABEL, fill=TEXT_GRAY)
                    # Bar
                    draw.rounded_rectangle([(mx1 + 40, fy + 60), (mx2 - 40, fy + 72)], radius=6, fill=(30, 35, 48))
                    draw.rounded_rectangle([(mx1 + 40, fy + 60), (mx1 + 40 + int((mx2 - mx1 - 80) * (int(f_pct[:-1]) / 100.0)), fy + 72)], radius=6, fill=f_col)

                # Recommendation Banner
                draw.rounded_rectangle([(mx1 + 40, my2 - 140), (mx2 - 40, my2 - 40)], radius=12, fill=(25, 30, 45), outline=EMERALD_GREEN)
                draw.text((mx1 + 60, my2 - 120), "💡 High-Gradient Candidate: Reviewing this image yields 3.8x faster model convergence.", font=FONT_BOLD, fill=EMERALD_GREEN)
                draw.text((mx1 + 60, my2 - 80), "Proceeding to Annotation Workspace to correct the bounding box...", font=FONT_LABEL, fill=TEXT_WHITE)

                # Cursor hovers on modal close / proceed
                cx, cy = mx2 - 120, my2 - 80
                draw_cursor(draw, cx, cy)
            else:
                # Transitioning into workspace
                cx, cy = 1200, 420
                draw_cursor(draw, cx, cy)

            add_hud_bar(
                frame,
                "STEP 02 / TRIAGE DIAGNOSTIC",
                "Explain AI Decision (Multi-Factor Scoring)",
                "Model explains its uncertainty: 68% high entropy, 22% rare class, 10% outlier diversity.",
                AMBER_YELLOW,
                p,
            )

        # ---------------------------------------------------------------------
        # PART 3: LIVE ISSUE RESOLUTION IN ANNOTATION STUDIO (28s - 48s)
        # ---------------------------------------------------------------------
        elif frame_idx < 1440:
            p = (frame_idx - 840) / 600.0
            frame = sc_workspace.copy()
            draw = ImageDraw.Draw(frame)

            # Center Canvas Coordinates
            cx1, cy1, cx2, cy2 = 380, 240, 1420, 840
            
            # Paste the actual aerial disaster image on the workspace canvas
            canvas_photo = disaster_img.resize((cx2 - cx1, cy2 - cy1))
            frame.paste(canvas_photo, (cx1, cy1))

            # Phase A: Initial AI Box (Shaky / Misaligned 52% Confidence)
            if p < 0.35:
                bx1, by1, bx2, by2 = cx1 + 180, cy1 + 140, cx1 + 420, cy1 + 340
                draw.rectangle([(bx1, by1), (bx2, by2)], outline=AMBER_YELLOW, width=3)
                draw.rectangle([(bx1, by1 - 32), (bx1 + 280, by1)], fill=AMBER_YELLOW)
                draw.text((bx1 + 10, by1 - 26), "🏚️ Damaged Building 52%", font=FONT_LABEL, fill=(10, 15, 20))

                # Cursor moves to corner handle to drag
                cp = ease_in_out(p / 0.35)
                cur_x = int(600 + cp * (bx2 - 600))
                cur_y = int(400 + cp * (by2 - 400))
                draw_cursor(draw, cur_x, cur_y)

            # Phase B: Dragging Corner to Perfectly Fit Debris + Correcting Class
            elif p < 0.70:
                drag_p = ease_in_out((p - 0.35) / 0.35)
                bx1, by1 = cx1 + 140, cy1 + 110
                bx2 = int(cx1 + 420 + drag_p * 180)  # Expand width
                by2 = int(cy1 + 340 + drag_p * 120)  # Expand height

                draw.rectangle([(bx1, by1), (bx2, by2)], outline=EMERALD_GREEN, width=4)
                draw.rectangle([(bx1, by1 - 34), (bx1 + 320, by1)], fill=EMERALD_GREEN)
                draw.text((bx1 + 10, by1 - 28), "✓ Damaged Building (Verified 100%)", font=FONT_LABEL, fill=(10, 15, 20))

                # Draw Second Box (Plume in background)
                if drag_p > 0.4:
                    draw.rectangle([(cx1 + 650, cy1 + 80), (cx1 + 880, cy1 + 260)], outline=(168, 85, 247), width=3)
                    draw.rectangle([(cx1 + 650, cy1 + 50), (cx1 + 840, cy1 + 80)], fill=(168, 85, 247))
                    draw.text((cx1 + 660, cy1 + 54), "🔥 Smoke / Fire (Verified)", font=FONT_LABEL, fill=TEXT_WHITE)

                # Cursor at handle
                cur_x, cur_y = bx2, by2
                draw_cursor(draw, cur_x, cur_y, is_clicking=True, click_radius=12)

            # Phase C: Clicking "Accept & Verify" + Celebration Toast & Confetti Burst
            else:
                accept_p = (p - 0.70) / 0.30
                bx1, by1, bx2, by2 = cx1 + 140, cy1 + 110, cx1 + 600, cy1 + 460

                # Verified boxes
                draw.rectangle([(bx1, by1), (bx2, by2)], outline=EMERALD_GREEN, width=4)
                draw.rectangle([(bx1, by1 - 34), (bx1 + 320, by1)], fill=EMERALD_GREEN)
                draw.text((bx1 + 10, by1 - 28), "✓ Damaged Building (Verified 100%)", font=FONT_LABEL, fill=(10, 15, 20))

                draw.rectangle([(cx1 + 650, cy1 + 80), (cx1 + 880, cy1 + 260)], outline=(168, 85, 247), width=3)
                draw.rectangle([(cx1 + 650, cy1 + 50), (cx1 + 840, cy1 + 80)], fill=(168, 85, 247))
                draw.text((cx1 + 660, cy1 + 54), "🔥 Smoke / Fire (Verified)", font=FONT_LABEL, fill=TEXT_WHITE)

                # Cursor clicks the green "Accept & Next" Button at bottom
                btn_x, btn_y = cx1 + 160, cy2 + 35
                draw_cursor(draw, btn_x, btn_y, is_clicking=True, click_radius=int(accept_p * 35))

                # Toast Notification Popup
                draw.rounded_rectangle([(cx1 + 180, cy1 + 30), (cx2 - 180, cy1 + 105)], radius=16, fill=(15, 45, 25), outline=EMERALD_GREEN, width=2)
                draw.text((cx1 + 220, cy1 + 45), "🎉 ISSUE RESOLVED: Image #0001 Verified & Synced!", font=FONT_BOLD, fill=EMERALD_GREEN)
                draw.text((cx1 + 220, cy1 + 75), "Review time: 6.2s (vs 30s manual baseline) • Queue remaining: 254", font=FONT_LABEL, fill=TEXT_WHITE)

                # Confetti particles animating outward
                for cp_item in confetti_particles:
                    px = int(cp_item["x"] + cp_item["vx"] * (accept_p * 25))
                    py = int(cp_item["y"] + cp_item["vy"] * (accept_p * 25) + 0.5 * 9.8 * (accept_p * 2.5) ** 2)
                    sz = cp_item["size"]
                    draw.rectangle([(px, py), (px + sz, py + sz)], fill=cp_item["color"])

            add_hud_bar(
                frame,
                "STEP 03 / ISSUE RESOLUTION",
                "Human Verifies & Corrects Bounding Box in Studio",
                "Adjusted bounding box to capture debris + tagged smoke plume. Keystroke shortcut [Enter] verified.",
                EMERALD_GREEN,
                p,
            )

        # ---------------------------------------------------------------------
        # PART 4: CLOSED-LOOP MODEL RETRAINING & ELEVATION (48s - 60s)
        # ---------------------------------------------------------------------
        elif frame_idx < 1800:
            p = (frame_idx - 1440) / 360.0
            frame = sc_evolution.copy()
            draw = ImageDraw.Draw(frame)

            # Cursor clicks the "Simulate Retraining Round" button at top right
            if p < 0.3:
                cp = ease_in_out(p / 0.3)
                cx = int(1200 + cp * 480)
                cy = int(600 - cp * 420)
                draw_cursor(draw, cx, cy)
            else:
                # Retraining execution banner in action
                train_p = (p - 0.3) / 0.7
                # Retraining HUD card
                rx1, ry1, rx2, ry2 = 450, 320, 1470, 740
                draw.rounded_rectangle([(rx1, ry1), (rx2, ry2)], radius=20, fill=(14, 16, 26), outline=BLUE_ACCENT, width=3)

                draw.text((rx1 + 40, ry1 + 35), "⚡ Executing Closed-Loop YOLOv8 Retraining", font=FONT_HEADING, fill=TEXT_WHITE)
                draw.text((rx1 + 40, ry1 + 75), f"Fine-tuning YOLOv8 on newly verified human corrections (Round 1)...", font=FONT_SUBTITLE, fill=TEXT_GRAY)

                # Dynamic Progress Bar
                draw.rounded_rectangle([(rx1 + 40, ry1 + 130), (rx2 - 40, ry1 + 155)], radius=10, fill=(25, 30, 45))
                prog_w = int((rx2 - rx1 - 80) * min(1.0, train_p * 1.2))
                draw.rounded_rectangle([(rx1 + 40, ry1 + 130), (rx1 + 40 + prog_w, ry1 + 155)], radius=10, fill=EMERALD_GREEN)
                draw.text((rx2 - 140, ry1 + 165), f"{min(100, int(train_p * 120))}% COMPLETE", font=FONT_MONO, fill=EMERALD_GREEN)

                # Real-time Metrics Gain Counter
                current_map = 60.9 + min(10.3, train_p * 12.0)
                draw.rounded_rectangle([(rx1 + 40, ry1 + 220), (rx1 + 440, ry1 + 360)], radius=14, fill=(20, 25, 40), outline=CARD_BORDER)
                draw.text((rx1 + 60, ry1 + 240), "NEW MODEL ACCURACY", font=FONT_LABEL, fill=TEXT_MUTED)
                draw.text((rx1 + 60, ry1 + 275), f"{current_map:.1f}%", font=FONT_TITLE, fill=(96, 165, 250))
                draw.text((rx1 + 60, ry1 + 325), "mAP@50 (+10.3% Round Gain)", font=FONT_LABEL, fill=EMERALD_GREEN)

                draw.rounded_rectangle([(rx1 + 480, ry1 + 220), (rx2 - 40, ry1 + 360)], radius=14, fill=(20, 35, 28), outline=EMERALD_GREEN)
                draw.text((rx1 + 510, ry1 + 240), "HUMAN LABOR SAVINGS", font=FONT_LABEL, fill=TEXT_MUTED)
                draw.text((rx1 + 510, ry1 + 275), "47.0%", font=FONT_TITLE, fill=EMERALD_GREEN)
                draw.text((rx1 + 510, ry1 + 325), "Saved vs. full manual baseline", font=FONT_LABEL, fill=TEXT_WHITE)

                cx, cy = rx2 - 100, ry1 + 60
                draw_cursor(draw, cx, cy)

            add_hud_bar(
                frame,
                "STEP 04 / CLOSED LOOP RETRAINING",
                "Model Retraining Triggered on Human Corrections",
                "YOLOv8 fine-tuned on verified edge cases. Model mAP@50 elevates from 60.9% -> 71.2% in Round 1.",
                BLUE_ACCENT,
                p,
            )

        # ---------------------------------------------------------------------
        # PART 5: PRODUCTION WEIGHTS EXPORT & SUMMARY (60s - 70s)
        # ---------------------------------------------------------------------
        else:
            p = (frame_idx - 1800) / 300.0
            frame = sc_export.copy()
            draw = ImageDraw.Draw(frame)

            # Cursor moves to "Download Model Checkpoint"
            cp = ease_in_out(min(1.0, p * 2.0))
            cx = int(800 + cp * 750)
            cy = int(400 + cp * 300)
            draw_cursor(draw, cx, cy, is_clicking=p > 0.5, click_radius=int((p - 0.5) * 30) if p > 0.5 else 0)

            add_hud_bar(
                frame,
                "STEP 05 / PRODUCTION EXPORT",
                "Exporting Retrained YOLOv8 Weights & Manifest",
                "Exported models/round_1/best.pt and human_labels.json. LabelLess AI loop complete!",
                PURPLE_ACCENT,
                p,
            )

        # Convert to OpenCV BGR
        cv_frame = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR)
        out.write(cv_frame)

        if frame_idx % 200 == 0 or frame_idx == total_frames - 1:
            print(f"  Rendered {frame_idx}/{total_frames} frames ({frame_idx/total_frames*100:.1f}%)")

    out.release()
    print(f"\n✅ Detailed Interactive Walkthrough saved to: {OUTPUT_MP4}")

    # Copy to root
    import shutil
    shutil.copy2(OUTPUT_MP4, ROOT_MP4)
    print(f"✅ Copied to root workspace at: {ROOT_MP4}")
    print(f"📦 File size: {ROOT_MP4.stat().st_size / (1024 * 1024):.2f} MB")


if __name__ == "__main__":
    main()
