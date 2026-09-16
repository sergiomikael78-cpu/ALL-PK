package com.pkmatrix.keyboard;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * TEMPLATE REPOSITORY
 * Mengelola penyimpanan lokal template dan sinkronisasi otomatis dengan Firebase Realtime DB.
 */
public class TemplateRepository {

    private static final String TAG = "PK_REPO";
    private static final String PREF_NAME = "pk_keyboard_prefs";
    private static final String KEY_TEMPLATES_JSON = "cached_templates_json";
    private static final String DEFAULT_FIREBASE_URL = "https://pk-matrix2-default-rtdb.firebaseio.com/pk_templates.json";

    private final SharedPreferences prefs;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public interface SyncCallback {
        void onSuccess(int count);
        void onError(String message);
    }

    public TemplateRepository(Context context) {
        this.prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    /**
     * Membaca daftar template tersimpan dari cache lokal
     */
    public List<TriggerEngine.TemplateItem> loadLocalTemplates() {
        String jsonStr = prefs.getString(KEY_TEMPLATES_JSON, null);
        if (jsonStr == null || jsonStr.trim().isEmpty()) {
            return getDefaultTemplates();
        }
        return parseJson(jsonStr);
    }

    /**
     * Menyimpan template ke penyimpanan lokal SharedPreferences
     */
    public void saveLocalTemplates(String rawJson) {
        prefs.edit().putString(KEY_TEMPLATES_JSON, rawJson).apply();
    }

    /**
     * Sinkronisasi template secara otomatis dari Firebase Cloud Database (REST API)
     */
    public void syncFromFirebase(String customUrl, SyncCallback callback) {
        final String targetUrl = (customUrl != null && !customUrl.trim().isEmpty())
                ? (customUrl.endsWith(".json") ? customUrl : customUrl + ".json")
                : DEFAULT_FIREBASE_URL;

        executor.execute(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(targetUrl);
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);

                int responseCode = conn.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = in.readLine()) != null) {
                        sb.append(line);
                    }
                    in.close();

                    String resultJson = sb.toString();
                    List<TriggerEngine.TemplateItem> parsed = parseJson(resultJson);

                    if (!parsed.isEmpty()) {
                        saveLocalTemplates(resultJson);
                        mainHandler.post(() -> callback.onSuccess(parsed.size()));
                    } else {
                        mainHandler.post(() -> callback.onError("Database terhubung, namun belum ada template."));
                    }
                } else {
                    mainHandler.post(() -> callback.onError("HTTP Error: " + responseCode));
                }
            } catch (Exception e) {
                Log.e(TAG, "Gagal sinkronisasi dari Firebase", e);
                mainHandler.post(() -> callback.onError("Gagal koneksi: " + e.getMessage()));
            } finally {
                if (conn != null) conn.disconnect();
            }
        });
    }

    /**
     * Parser JSON untuk membaca format array template dari Firebase atau Web PK Matrix
     */
    public List<TriggerEngine.TemplateItem> parseJson(String jsonString) {
        List<TriggerEngine.TemplateItem> list = new ArrayList<>();
        try {
            if (jsonString == null || jsonString.trim().isEmpty()) return list;

            // Bisa berupa array langsung [...] atau object { templates: [...] }
            JSONArray array = null;
            if (jsonString.trim().startsWith("[")) {
                array = new JSONArray(jsonString);
            } else if (jsonString.trim().startsWith("{")) {
                JSONObject obj = new JSONObject(jsonString);
                if (obj.has("templates")) {
                    array = obj.getJSONArray("templates");
                }
            }

            if (array != null) {
                for (int i = 0; i < array.length(); i++) {
                    JSONObject item = array.optJSONObject(i);
                    if (item == null) continue;

                    String id = item.optString("id", String.valueOf(i));
                    String name = item.optString("name", item.optString("title", ""));
                    String trigger = item.optString("trigger", item.optString("shortcut", ""));
                    String content = item.optString("content", item.optString("text", ""));
                    String category = item.optString("category", "Umum");

                    if (!trigger.isEmpty() && !content.isEmpty()) {
                        list.add(new TriggerEngine.TemplateItem(id, name, trigger, content, category));
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing JSON template", e);
        }
        return list;
    }

    /**
     * Template awal bawaan agar keyboard langsung siap pakai saat pertama kali diinstall
     */
    private List<TriggerEngine.TemplateItem> getDefaultTemplates() {
        List<TriggerEngine.TemplateItem> defaults = new ArrayList<>();
        defaults.add(new TriggerEngine.TemplateItem("1", "Salam Pembuka", "cek/",
                "Halo kak, selamat datang di LiveChat resmi kami. Ada yang bisa kami bantu hari ini?", "Salam"));
        defaults.add(new TriggerEngine.TemplateItem("2", "Format Deposit", "dp/",
                "Halo kak, untuk proses deposit silakan transfer ke rekening aktif kami dan lampirkan bukti transfernya ya.", "Deposit"));
        defaults.add(new TriggerEngine.TemplateItem("3", "Format Penarikan", "wd/",
                "Permintaan penarikan dana (withdraw) Anda sedang dalam antrean proses tim finance kami. Mohon ditunggu 3-5 menit ya kak.", "Withdraw"));
        defaults.add(new TriggerEngine.TemplateItem("4", "Salam Penutup", "bye/",
                "Terima kasih telah menghubungi kami kak. Jika ada kendala lain, jangan ragu untuk chat kami kembali ya. Selamat beraktivitas!", "Closing"));
        return defaults;
    }
}
