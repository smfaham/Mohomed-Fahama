package com.brivo.wearos

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.core.view.InputDeviceCompat
import androidx.core.view.MotionEventCompat
import androidx.core.view.ViewConfigurationCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView
    private lateinit var vibrator: Vibrator

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Keep screen on while interacting
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Initialize Vibrator for Wear OS Haptics
        vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }

        // Initialize WebView
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            setBackgroundColor(0xFF050505.toInt())
            isVerticalScrollBarEnabled = false
            isHorizontalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER
        }

        // Setup AssetLoader to serve bundled files under https://appassets.androidplatform.net/assets/dist/
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onGeolocationPermissionsShowPrompt(
                origin: String,
                callback: GeolocationPermissions.Callback
            ) {
                // Auto-grant location to local assets for sunrise/solar calculation
                callback.invoke(origin, true, false)
            }
        }

        // Bridge Wear OS native haptic engine into JavaScript
        webView.addJavascriptInterface(object {
            @JavascriptInterface
            fun playHapticTick() {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(18, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(18)
                }
            }

            @JavascriptInterface
            fun playSunriseNotificationVibration() {
                // Triple-pulse Wear OS alert vibration pattern
                val pattern = longArrayOf(0, 160, 120, 160, 120, 240)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val amplitudes = intArrayOf(0, 255, 0, 220, 0, 255)
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, amplitudes, -1))
                } else {
                    @Suppress("DEPRECATION")
                    vibrator.vibrate(pattern, -1)
                }
            }
        }, "WearOSHaptics")

        setContentView(webView)

        // Load bundled Brivo web assets
        webView.loadUrl("https://appassets.androidplatform.net/assets/dist/index.html")
    }

    // Capture rotary input from Wear OS digital crown / rotating bezel
    override fun onGenericMotionEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_SCROLL &&
            event.isFromSource(InputDeviceCompat.SOURCE_ROTARY_ENCODER)
        ) {
            val delta = -event.getAxisValue(MotionEventCompat.AXIS_SCROLL) *
                    ViewConfigurationCompat.getScaledVerticalScrollFactor(
                        android.view.ViewConfiguration.get(this), this
                    )
            // Dispatch rotary rotation event into webview
            val direction = if (delta > 0) "down" else "up"
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('wear-rotary', { detail: { direction: '$direction', delta: $delta } }));",
                null
            )
            return true
        }
        return super.onGenericMotionEvent(event)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            @Suppress("DEPRECATION")
            super.onBackPressed()
        }
    }
}
