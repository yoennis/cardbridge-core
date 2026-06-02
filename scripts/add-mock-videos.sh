#!/bin/bash
# Places a real MP4 file as mock data for testing.
# Usage: ./scripts/add-mock-videos.sh /path/to/your-video.mp4

set -e

VIDEO=$1
if [ -z "$VIDEO" ]; then
  echo "Usage: $0 /path/to/video.mp4"
  exit 1
fi

FILENAME=$(basename "$VIDEO")
DATE=$(date +%Y-%m-%d)

mkdir -p "mock-data/dashcam-front/$DATE"
mkdir -p "mock-data/drone-cam/$DATE"

cp "$VIDEO" "mock-data/dashcam-front/$DATE/$FILENAME"
cp "$VIDEO" "mock-data/drone-cam/$DATE/$FILENAME"

echo "Added $FILENAME to mock-data under $DATE"
