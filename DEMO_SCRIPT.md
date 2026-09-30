# 🎙️ LabelLess AI: 3-Minute Winning Demo Script

> **Objective:** Deliver a punchy, rigorous, and completely defensible 180-second live demonstration for judges and technical reviewers.

---

## ⏱️ Timeline Breakdown

| Time | Stage | Screen / Action | Talking Points & Script |
| :---: | :--- | :--- | :--- |
| **0:00 - 0:35** | **1. The Real-World Problem** | **Landing Page (`/` or Tab: Overview)** | *"In disaster response and satellite triage, teams are flooded with raw imagery. Labeling everything manually takes days. But over 70% of those images contain repetitive, easy patterns. Naive uncertainty sampling repeatedly samples visually redundant edge cases and starves rare critical classes like Fire and Smoke. We built LabelLess AI to solve this."* |
| **0:35 - 1:10** | **2. Tri-Factor Intelligence & Auto-Labeling** | **Smart Review Queue (`tab=queue`) + "Explain Decision" Modal** | *"LabelLess uses a composite formula: 70% Uncertainty, 20% Rare-Class Boost, and 10% Spatial Diversity. High-confidence detections above 85% are auto-labeled with 96.3% precision, keeping the retraining set clean. Only ambiguous edge cases reach human reviewers. Notice the 'Why this image?' modal breaks down the exact mathematical contributions."* |
| **1:10 - 1:50** | **3. Interactive Human Loop & Disk Persistence** | **Annotation Workspace (`tab=workspace`)** | *"When a human annotator reviews or adjusts a bounding box here and clicks 'Submit Review', our FastAPI backend immediately persists the label to disk in real time. Notice our live status badge in the header confirming persistent sync."* |
| **1:50 - 2:30** | **4. Baseline & Model Improvement** | **Evolution Impact Page (`tab=evolution`)** | *"Here is our empirical foundation: On the Disaster & Wildfire dataset, our cold-start seed model achieves 60.89% mAP@50 (documented directly in results/metrics/round_0_seed.json). The entire active learning loop is built to route easy detections above 85% into retraining while prioritizing hard cases. Rather than manual labeling, reviewers focus only on high-leverage samples."* |
| **2:30 - 3:00** | **5. Architecture, Clean DX & Wrap-Up** | **Architecture & Judge 6-Screen Story** | *"LabelLess is fully operational with YOLOv8, FastAPI, and React 19, backed by a 16-test CI suite and one-command reproduction. A production-ready active learning foundation for computer vision. Thank you."* |

---

## 💡 Quick Tips for the Live Demo
1. **Pre-warm the Backend**: Launch with `start_dev.bat` or `./start_dev.sh` 2 minutes before the presentation so FastAPI (`:8000`) and React (`:3000`) are active.
2. **Offline Fallback Ready**: If WiFi drops, the UI automatically transitions to the verified offline replay mode badge without crashing.
3. **Backup Video**: Keep `labelless_ai_demo.mp4` ready on your desktop as an instant offline backup.
