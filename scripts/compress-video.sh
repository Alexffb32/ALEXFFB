#!/usr/bin/env bash
# Re-compress a background video in place: scales down, strips audio
# (these are always `muted` in the HTML anyway), faststart for progressive
# playback. Same visual content, much smaller file — same filename in,
# same filename out, so no HTML changes are needed.
#
# Usage: scripts/compress-video.sh path/to/video.mp4
#
# Requires ffmpeg on PATH: https://ffmpeg.org/download.html
set -euo pipefail

IN="$1"
TMP="${IN%.mp4}.tmp.mp4"

ffmpeg -y -i "$IN" \
  -vf "scale='min(720,iw)':-2,format=yuv420p" \
  -c:v libx264 -profile:v high -crf 30 -preset slow \
  -movflags +faststart -an \
  "$TMP"

mv "$TMP" "$IN"
echo "Done: $IN"
