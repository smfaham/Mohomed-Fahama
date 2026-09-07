#!/bin/bash
set -e

echo "=================================================="
echo "  Brivo Wear OS - Android App Bundle (.aab) Builder"
echo "=================================================="

# 1. Build web application
echo "1/3 Building production web assets..."
npm run build

# 2. Sync web assets into Android project
echo "2/3 Copying assets to android/app/src/main/assets/dist..."
mkdir -p android/app/src/main/assets/dist
rm -rf android/app/src/main/assets/dist/*
cp -r dist/* android/app/src/main/assets/dist/

# 3. Check for Java and build .AAB
echo "3/3 Compiling Android App Bundle (.aab)..."
if [ ! -f android/gradle/wrapper/gradle-wrapper.jar ]; then
    echo "Downloading gradle-wrapper.jar..."
    mkdir -p android/gradle/wrapper
    curl -sSL "https://raw.githubusercontent.com/gradle/gradle/v8.7.0/gradle/wrapper/gradle-wrapper.jar" -o android/gradle/wrapper/gradle-wrapper.jar
fi

if command -v java >/dev/null 2>&1; then
    cd android
    chmod +x gradlew
    ./gradlew bundleRelease
    echo "=================================================="
    echo "SUCCESS! Your .AAB file has been generated at:"
    echo "android/app/build/outputs/bundle/release/app-release.aab"
    echo "=================================================="
else
    echo "--------------------------------------------------"
    echo "Java / Android SDK not detected in this environment."
    echo "The full Wear OS package is pre-configured in ./android"
    echo "To compile the .aab:"
    echo "  1. Export project via Settings -> 'Export to GitHub' or 'Export ZIP'"
    echo "  2. Open the './android' folder in Android Studio"
    echo "  3. Click 'Build' -> 'Generate Signed Bundle / APK' -> 'Android App Bundle'"
    echo "     OR run './android/gradlew bundleRelease'"
    echo "--------------------------------------------------"
fi
