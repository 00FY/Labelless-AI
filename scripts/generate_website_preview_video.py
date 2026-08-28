import sys
import os
import math
import subprocess
import tempfile
import time
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
OUTPUT_MP4 = OUTPUT_DIR / "website_preview.mp4"
ROOT_MP4 = PROJECT_ROOT / "website_preview.mp4"

# Chrome path
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
WIDTH, HEIGHT = 1920, 1080
FPS = 30

# Font Setup
FONT_DIR = Path("C:/Windows/Fonts")
FONT_TITLE = ImageFont.truetype(str(FONT_DIR / "segoeuib.ttf"), 32)
FONT_SUBTITLE = ImageFont.truetype(str(FONT_DIR / "segoeui.ttf"), 20)
FONT_BADGE = ImageFont.truetype(str(FONT_DIR / "consolab.ttf"), 18)
FONT_TEXT = ImageFont.truetype(str(FONT_DIR / "segoeui.ttf"), 22)


def capture_tab_screenshot(tab_name: str, out_path: Path, delay_ms=3000):
    """Capture authentic live screenshot from Vite dev server."""
    temp_dir = tempfile.mkdtemp()
    url = f"http://localhost:3000/?tab={tab_name}"
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        f"--user-data-dir={temp_dir}",
        f"--screenshot={str(out_path)}",
        "--window-size=1920,1080",
        "--hide-scrollbars",
        f"--virtual-time-budget={delay_ms}",
        url,
    ]
    subprocess.run(cmd, capture_output=True, text=True)
    if not out_path.exists():
        print(f"Warning: Screenshot failed for tab '{tab_name}'")


def add_hud_overlay(pil_img: Image.Image, scene_title: str, scene_desc: str, badge_text: str, badge_color: tuple, progress: float):
    """Adds a lower-third commentary bar and camera overlay to the live screenshot."""
    frame = pil_img.copy().convert("RGB")
    draw = ImageDraw.Draw(frame)

    # Lower-third glassmorphism commentary card
    box_y1, box_y2 = 910, 1040
    box_x1, box_x2 = 60, 1860

    # Dark translucent background banner
    banner = Image.new("RGBA", (box_x2 - box_x1, box_y2 - box_y1), (10, 12, 18, 230))
    frame.paste(banner, (box_x1, box_y1), mask=banner)

    # Border & Badge
    draw.rounded_rectangle([(box_x1, box_y1), (box_x2, box_y2)], radius=16, outline=(60, 65, 85), width=2)
    
    # Category badge
    draw.rounded_rectangle([(box_x1 + 25, box_y1 + 20), (box_x1 + 240, box_y1 + 55)], radius=8, fill=badge_color)
    draw.text((box_x1 + 38, box_y1 + 26), badge_text, font=FONT_BADGE, fill=(10, 15, 20))

    # Scene Title
    draw.text((box_x1 + 260, box_y1 + 22), scene_title, font=FONT_TITLE, fill=(255, 255, 255))
    
    # Description
    draw.text((box_x1 + 260, box_y1 + 72), scene_desc, font=FONT_SUBTITLE, fill=(180, 185, 205))

    # Progress bar inside card
    p_width = int((box_x2 - box_x1 - 50) * progress)
    draw.rectangle([(box_x1 + 25, box_y2 - 12), (box_x2 - 25, box_y2 - 8)], fill=(35, 40, 55))
    draw.rectangle([(box_x1 + 25, box_y2 - 12), (box_x1 + 25 + p_width, box_y2 - 8)], fill=(59, 130, 246))

    return frame


def zoom_and_pan(img: Image.Image, zoom_factor: float, pan_x: float, pan_y: float):
    """Simulates cinematic camera pan and zoom across UI."""
    w, h = img.size
    crop_w = int(w / zoom_factor)
    crop_h = int(h / zoom_factor)

    x1 = int((w - crop_w) * pan_x)
    y1 = int((h - crop_h) * pan_y)
    x2 = x1 + crop_w
    y2 = y1 + crop_h

    cropped = img.crop((x1, y1, x2, y2))
    return cropped.resize((w, h), Image.Resampling.LANCZOS)


def main():
    print(f"🎬 Starting Full Detailed Website Walkthrough Generator ({WIDTH}x{HEIGHT} @ {FPS} FPS)...")

    # Step 1: Capture live tabs
    tabs = [
        ("landing", "Project Overview & Value Proposition", "AI handles easy annotations; humans handle difficult edge cases", "01 / PITCH", (59, 130, 246)),
        ("dashboard", "Pipeline Dashboard & Ingestion Metrics", "73.7% auto-labeled, 26.3% triaged review queue, +27.5% active learning mAP gain", "02 / DASHBOARD", (16, 185, 129)),
        ("queue", "Smart Active Learning Review Queue", "Multi-factor priority ranking: Uncertainty (70%), Rare Class (20%), Diversity (10%)", "03 / TRIAGE QUEUE", (244, 63, 94)),
        ("workspace", "Accelerated Annotation Studio", "Interactive bounding box canvas with AI pre-boxes & 3.8x faster review keystrokes", "04 / WORKSPACE", (168, 85, 247)),
        ("evolution", "Model Impact & Verified Benchmarks", "47.0% human effort saved vs random baseline with 88.4% final mAP@50", "05 / BENCHMARKS", (245, 158, 11)),
        ("export", "Production Output & Weights Export", "Export fine-tuned YOLOv8 weights (.pt) and human_labels.json for closed-loop training", "06 / EXPORT", (59, 130, 246)),
        ("processing", "Real-Time AI Stream & Routing Engine", "Live telemetry monitoring autonomous pseudo-labeling vs human queue routing", "07 / LIVE STREAM", (16, 185, 129)),
    ]

    captured_screens = {}
    print("\n📸 Capturing high-resolution screenshots from live website (http://localhost:3000)...")
    for tab_id, _, _, _, _ in tabs:
        sc_path = OUTPUT_DIR / f"cap_{tab_id}.png"
        print(f"  Capturing tab: '{tab_id}' -> {sc_path.name}")
        capture_tab_screenshot(tab_id, sc_path, delay_ms=2500)
        if sc_path.exists():
            captured_screens[tab_id] = Image.open(sc_path).convert("RGB")
        else:
            # Fallback black frame
            captured_screens[tab_id] = Image.new("RGB", (WIDTH, HEIGHT), (15, 15, 20))

    # Step 2: Render 56-second detailed video (8 seconds per tab = 240 frames each)
    frames_per_scene = 240
    total_frames = len(tabs) * frames_per_scene
    print(f"\n🎥 Rendering {total_frames} total frames ({total_frames/FPS:.1f} seconds total duration)...")

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(OUTPUT_MP4), fourcc, float(FPS), (WIDTH, HEIGHT))

    if not out.isOpened():
        print("❌ Error: Could not open OpenCV VideoWriter.")
        sys.exit(1)

    for tab_idx, (tab_id, scene_title, scene_desc, badge_text, badge_color) in enumerate(tabs):
        base_screenshot = captured_screens[tab_id]
        print(f"  Rendering Scene {tab_idx+1}/{len(tabs)}: {tab_id.upper()} ({scene_title})...")

        for f in range(frames_per_scene):
            p = f / frames_per_scene

            # Smooth dynamic camera effect (gentle zoom from 1.0 -> 1.06 and pan)
            zoom = 1.0 + 0.06 * math.sin(p * math.pi)
            pan_x = 0.5 + 0.04 * math.sin(p * math.pi)
            pan_y = 0.3 + 0.15 * p  # gentle scroll down the page

            zoomed_img = zoom_and_pan(base_screenshot, zoom, pan_x, pan_y)

            # Add HUD Commentary overlay
            final_frame = add_hud_overlay(zoomed_img, scene_title, scene_desc, badge_text, badge_color, p)

            # Smooth fade in/out between scenes
            if f < 10 and tab_idx > 0:
                alpha = f / 10.0
                prev_screen = captured_screens[tabs[tab_idx - 1][0]]
                final_frame = Image.blend(prev_screen, final_frame, alpha)

            # Convert to OpenCV BGR
            cv_frame = cv2.cvtColor(np.array(final_frame), cv2.COLOR_RGB2BGR)
            out.write(cv_frame)

    out.release()
    print(f"\n✅ Website Preview Video saved successfully to: {OUTPUT_MP4}")

    # Copy to root
    import shutil
    shutil.copy2(OUTPUT_MP4, ROOT_MP4)
    print(f"✅ Copied to root workspace at: {ROOT_MP4}")
    print(f"📦 File size: {ROOT_MP4.stat().st_size / (1024 * 1024):.2f} MB")


if __name__ == "__main__":
    main()
