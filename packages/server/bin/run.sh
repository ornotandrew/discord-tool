#!/bin/bash
# Resolve the actual path to this script (following symlinks)
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
    DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
# Get the directory of the actual script
SCRIPT_DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
# Go up to package root and find dist
PACKAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
exec node "$PACKAGE_DIR/dist/index.js" "$@"