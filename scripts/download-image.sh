#!/bin/bash
# Download a local placeholder image from Lorem Picsum.
# Usage:
#   ./scripts/download-image.sh                 # default preset (portrait)
#   ./scripts/download-image.sh 800             # width only
#   ./scripts/download-image.sh 600 400         # width x height
#   ./scripts/download-image.sh square          # preset
#
# Presets:
#   square     1:1
#   portrait   4:5
#   tall       3:4
#   landscape  3:2
#   wide       16:10
#   banner     21:9
#   hero       4:3

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../public/images/picsum"
RANDOM_PARAM=$((RANDOM % 10000))

mkdir -p "$OUTPUT_DIR"

print_help() {
    cat <<'EOF'
Usage:
  ./scripts/download-image.sh [preset|width [height]]

Presets:
  square     1:1
  portrait   4:5
  tall       3:4
  landscape  3:2
  wide       16:10
  banner     21:9
  hero       4:3

Examples:
  ./scripts/download-image.sh
  ./scripts/download-image.sh landscape
  ./scripts/download-image.sh 600 400
EOF
}

get_next_number() {
    local max_num=0
    local files
    files=$(find "$OUTPUT_DIR" -maxdepth 1 -type f -name '*.jpg' 2>/dev/null || true)

    for f in $files; do
        local filename
        filename=$(basename "$f" .jpg)
        if echo "$filename" | grep -qE '^[0-9]+$'; then
            local num=$((10#$filename))
            if [ "$num" -gt "$max_num" ]; then
                max_num=$num
            fi
        fi
    done

    echo $((max_num + 1))
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    print_help
    exit 0
fi

case "${1:-}" in
    square)
        set -- 800 800
        ;;
    portrait)
        set -- 800 1000
        ;;
    tall)
        set -- 900 1200
        ;;
    landscape)
        set -- 1200 800
        ;;
    wide)
        set -- 1600 1000
        ;;
    banner)
        set -- 1600 686
        ;;
    hero)
        set -- 1200 900
        ;;
    "")
        set -- 800 1000
        ;;
    *)
        if [ -n "${2:-}" ] && echo "${1:-}" | grep -qE '^[0-9]+$' && echo "${2:-}" | grep -qE '^[0-9]+$'; then
            set -- "$1" "$2"
        elif echo "${1:-}" | grep -qE '^[0-9]+$'; then
            set -- "$1"
        else
            echo "Error: unknown preset '$1'" >&2
            print_help
            exit 1
        fi
        ;;
esac

WIDTH=$1
HEIGHT=${2:-}

NEXT_NUM=$(get_next_number)
SEQ=$(printf "%03d" "$NEXT_NUM")
OUTPUT_FILE="$OUTPUT_DIR/${SEQ}.jpg"

if [ -n "$HEIGHT" ]; then
    URL="https://picsum.photos/${WIDTH}/${HEIGHT}?random=${RANDOM_PARAM}"
    SIZE_INFO="${WIDTH}x${HEIGHT}"
else
    URL="https://picsum.photos/${WIDTH}?random=${RANDOM_PARAM}"
    SIZE_INFO="${WIDTH}px width"
fi

echo "Downloading image ($SIZE_INFO)..."
if ! curl -fsSL -o "$OUTPUT_FILE" "$URL"; then
    echo "Error: Failed to download image" >&2
    rm -f "$OUTPUT_FILE"
    exit 1
fi

ACTUAL_SIZE=$(file "$OUTPUT_FILE" | grep -oE '[0-9]+x[0-9]+' | head -1 || true)
echo "Saved: ${SEQ}.jpg ${ACTUAL_SIZE:+($ACTUAL_SIZE)}"
echo "Path: /images/picsum/${SEQ}.jpg"
