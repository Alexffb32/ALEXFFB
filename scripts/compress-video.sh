#!/usr/bin/env bash
# Re-compress a background/hero video for the web: scales to 720px wide,
# strips audio (these videos are always muted/looped), and re-encodes with a
# faststart MP4 for progressive playback. Visual content is unchanged — only
# resolution/bitrate are reduced.
#
# Usage: scripts/compress-video.sh input.mp4 public/videos/output.mp4
#
# Requires ffmpeg on PATH: https://ffmpeg.org/download.html
set -euo pipefail

IN="$1"
OUT="$2"

ffmpeg -y -i "$IN" \
  -vf "scale=720:-2,format=yuv420p" \
  -c:v libx264 -profile:v high -crf 30 -preset slow \
  -movflags +faststart -an \
  "$OUT"

# Also drop a poster frame next to it (used as the <video poster> so the
# layout doesn't jump before the video loads):
ffmpeg -y -i "$OUT" -vframes 1 -q:v 3 "${OUT%.mp4}-poster.jpg"

echo "Done: $OUT"
