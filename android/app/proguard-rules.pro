# ProGuard rules for Brivo Wear OS
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class com.brivo.wearos.** { *; }
