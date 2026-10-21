#!/usr/bin/env bash
set -euo pipefail

if command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y grim slurp tesseract
  exit 0
fi

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y grim slurp tesseract-ocr
  exit 0
fi

if command -v pacman >/dev/null 2>&1; then
  sudo pacman -S --noconfirm grim slurp tesseract
  exit 0
fi

echo "Unsupported distro. Install grim, slurp, and tesseract manually." >&2
exit 1
