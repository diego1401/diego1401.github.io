#!/bin/bash

# Check if the input directory is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <input_directory>"
    exit 1
fi

# Input directory
INPUT_DIR="$1"

# Output directory
OUTPUT_DIR="$INPUT_DIR/compressed_videos"

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Loop through each video file in the input directory
for video in "$INPUT_DIR"/*; do
    # Check if the file is a video by using the 'file' command
    if file "$video" | grep -qE 'video|mp4|mkv|avi|mov'; then
        # Get the base name of the video file
        base_name=$(basename "$video")
        
        # Compress the video
        ffmpeg -i "$video" -vcodec libx265 -crf 28 "$OUTPUT_DIR/$base_name"
        
        echo "Compressed: $base_name"
    else
        echo "Skipping non-video file: $(basename "$video")"
    fi
done

echo "Compression completed. Compressed files are located in: $OUTPUT_DIR"
