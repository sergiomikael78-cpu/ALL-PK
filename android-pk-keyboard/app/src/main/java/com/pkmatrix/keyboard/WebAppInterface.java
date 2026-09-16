package com.pkmatrix.keyboard;

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.util.Log;
import android.view.inputmethod.InputMethodInfo;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import java.util.List;

/**
 * WEB APP INTERFACE (@JavascriptInterface Bridge)
 * Menjembatani seluruh event di dalam Web PK Matrix Vault (CRUD template, login akun)
 * langsung ke Layanan Keyboard Native Android.
 */
public class WebAppInterface {

    private static final String TAG = "PK_BRIDGE";
    private final Context context;
    private final TemplateRepository repository;

    public WebAppInterface(Context context) {
        this.context = context;
        this.repository = new TemplateRepository(context);
    }

    /**
     * Dipanggil secara otomatis dari JavaScript (android-bridge.js) saat:
     * 1. CS Login dengan User ID (misal: 'budi', 'cs01').
     * 2. Data template dimuat dari Firebase atau localStorage.
     * 3. CS menambah, mengedit, atau menghapus template.
     */
    @JavascriptInterface
    public void syncActiveUserTemplates(String userId, String templatesJson) {
        Log.d(TAG, "Menerima sinkronisasi template untuk user: " + userId);
        if (templatesJson != null && !templatesJson.trim().isEmpty()) {
            repository.saveLocalTemplates(templatesJson);
            List<TriggerEngine.TemplateItem> items = repository.parseJson(templatesJson);

            // Tampilkan notifikasi toast ringkas
            if (context != null) {
                String msg = "⚡ Keyboard PK Terhubung: " + items.size() + " template (" + userId + ") aktif!";
                Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
            }
        }
    }

    /**
     * Membuka pengaturan sistem Android untuk mengaktifkan keyboard
     */
    @JavascriptInterface
    public void openKeyboardSettings() {
        try {
            Intent intent = new Intent(Settings.ACTION_INPUT_METHOD_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            Log.e(TAG, "Gagal membuka pengaturan keyboard", e);
        }
    }

    /**
     * Membuka popup pemilih keyboard aktif
     */
    @JavascriptInterface
    public void showKeyboardPicker() {
        try {
            InputMethodManager imm = (InputMethodManager) context.getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) {
                imm.showInputMethodPicker();
            }
        } catch (Exception e) {
            Log.e(TAG, "Gagal membuka pemilih keyboard", e);
        }
    }

    /**
     * Memeriksa apakah PK Keyboard sudah diaktifkan di pengaturan HP
     */
    @JavascriptInterface
    public boolean isKeyboardEnabled() {
        try {
            InputMethodManager imm = (InputMethodManager) context.getSystemService(Context.INPUT_METHOD_SERVICE);
            if (imm != null) {
                List<InputMethodInfo> enabledMethods = imm.getEnabledInputMethodList();
                String myPackage = context.getPackageName();
                for (InputMethodInfo imi : enabledMethods) {
                    if (imi.getPackageName().equals(myPackage)) {
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Gagal cek status keyboard", e);
        }
        return false;
    }

    @JavascriptInterface
    public void showNativeToast(String message) {
        if (context != null && message != null) {
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show();
        }
    }
}
