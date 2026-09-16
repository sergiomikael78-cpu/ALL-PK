package com.pkmatrix.keyboard;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.view.inputmethod.InputMethodInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;

import androidx.appcompat.app.AppCompatActivity;

import java.util.List;

/**
 * MAIN ACTIVITY - ALL-IN-ONE CS SUPER-APP
 * Menjalankan antarmuka lengkap PK Matrix Vault di dalam WebView berkecepatan tinggi,
 * terhubung langsung dengan Layanan Keyboard Android melalui AndroidNativeBridge.
 */
public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private LinearLayout bannerSetup;
    private WebAppInterface webAppInterface;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview_main);
        bannerSetup = findViewById(R.id.banner_keyboard_setup);
        Button btnActivate = findViewById(R.id.btn_banner_activate);

        webAppInterface = new WebAppInterface(this);

        // Konfigurasi WebSettings agar performa setara browser native & offline-ready
        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setDatabaseEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setAllowContentAccess(true);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);
        ws.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Pasang bridge JavaScript
        webView.addJavascriptInterface(webAppInterface, "AndroidNativeBridge");

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Buka aset web PK Matrix lokal
        webView.loadUrl("file:///android_asset/www/index.html");

        // Tombol aktivasi di banner
        btnActivate.setOnClickListener(v -> {
            Intent intent = new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS);
            startActivity(intent);
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        checkKeyboardStatus();
    }

    private void checkKeyboardStatus() {
        boolean enabled = isKeyboardEnabled();
        if (!enabled) {
            bannerSetup.setVisibility(View.VISIBLE);
        } else {
            bannerSetup.setVisibility(View.GONE);
        }
    }

    private boolean isKeyboardEnabled() {
        try {
            InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) {
                List<InputMethodInfo> enabledMethods = imm.getEnabledInputMethodList();
                String myPackage = getPackageName();
                for (InputMethodInfo imi : enabledMethods) {
                    if (imi.getPackageName().equals(myPackage)) {
                        return true;
                    }
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
