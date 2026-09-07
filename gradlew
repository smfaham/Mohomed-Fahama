#!/bin/sh
# Root wrapper delegating to android/gradlew
PRG_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$PRG_DIR/android/gradlew" "$@"
