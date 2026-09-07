# Brivo for Wear OS - Full Package & .AAB Generation Guide

This project includes the complete native Android / Wear OS application package in the `android/` directory, configured specifically for building and publishing an **Android App Bundle (`.aab`)** to the Google Play Store for Wear OS devices.

---

## Package Overview

- **Application ID:** `com.brivo.wearos`
- **Target Platform:** Wear OS (Smartwatches)
- **Standalone Wearable:** `true` (can be downloaded directly on watches without a phone app)
- **Target SDK:** 34 (Android 14 / Wear OS 4+)
- **Min SDK:** 26 (Wear OS 2.0+)
- **Location & Sensors:** Fine/Coarse Location, Wear OS Rotary Crown / Digital Bezel scrolling, Wear OS Haptics & Vibration.

### Directory Structure

```
android/
├── build.gradle.kts           # Top-level Gradle configuration
├── settings.gradle.kts        # Project settings
├── gradle.properties          # JVM & AndroidX settings
├── gradlew & gradlew.bat      # Gradle wrapper scripts
├── gradle/wrapper/            # Gradle 8.7 distribution
└── app/
    ├── build.gradle.kts       # Wear OS app config & bundleRelease setup
    ├── proguard-rules.pro     # Code shrinking & obfuscation rules
    └── src/main/
        ├── AndroidManifest.xml # Wear OS standalone manifest & permissions
        ├── assets/dist/       # Bundled offline production web assets
        ├── java/com/brivo/wearos/
        │   └── MainActivity.kt# Wear OS native activity with haptics & crown control
        └── res/               # Wear OS app icons, themes, and strings
```

---

## 3 Ways to Generate your `.aab` File

### Method 1: Automatic Build via GitHub Actions (Zero Local Setup)
1. In Google AI Studio, click the **Settings menu (top right) -> "Export to GitHub"**.
2. Push or open the exported repository on GitHub.
3. The included workflow file (`.github/workflows/build-aab.yml`) will automatically trigger:
   - Sets up Node.js, JDK 17, and Android SDK 34
   - Compiles the web assets
   - Runs `./gradlew bundleRelease`
4. Under the **Actions** tab on your GitHub repository, download the completed **`brivo-wearos-release-aab`** artifact.

---

### Method 2: Command Line (Linux / macOS / WSL)
Prerequisites: JDK 17+ and Android SDK installed on your machine.

1. Export the project as a ZIP via AI Studio Settings, or clone your repository.
2. Build and bundle the latest assets:
   ```bash
   npm run build:android
   ```
3. Generate the Android App Bundle:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
4. Your `.aab` bundle will be generated at:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```

---

### Method 3: Using Android Studio (GUI)
1. Download/Export the project ZIP or clone from GitHub.
2. Open **Android Studio**.
3. Select **File -> Open...** and choose the `android` directory of this project.
4. Wait for Gradle Sync to complete.
5. In the top menu, go to:
   **Build -> Generate Signed Bundle / APK...**
6. Select **Android App Bundle** (`.aab`) and click **Next**.
7. Select your release keystore (or create a new one if this is your first release).
8. Select the **release** build variant and click **Finish**.
9. Android Studio will build and locate the `.aab` file ready for upload to the **Google Play Console** under the Wear OS release track.
