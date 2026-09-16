package com.pkmatrix.keyboard;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * TRIGGER ENGINE - High Performance CS Text Expansion
 * Memproses buffer pengetikan secara real-time dan mendeteksi pemicu seperti "cek/".
 * Mendukung:
 * 1. Multi-kalimat & multi-variasi per trigger.
 * 2. Tombol HotKey / NUM PC.
 * 3. Smart Prefix Ambiguity Detection (/q vs /qris) & Space-to-Expand.
 */
public class TriggerEngine {

    public static class TemplateItem {
        public String id;
        public String name;
        public String trigger;
        public String content;
        public String category;

        public TemplateItem(String id, String name, String trigger, String content, String category) {
            this.id = id;
            this.name = name;
            // Pertahankan spasi di akhir jika sengaja diatur pengguna (misal "/q ")
            this.trigger = trigger != null ? trigger.replaceAll("^\\s+", "") : "";
            this.content = content != null ? content : "";
            this.category = category != null ? category : "Umum";
        }
    }

    // Peta Trigger lowercase -> List<TemplateItem> agar semua variasi tersimpan aman O(1)
    private final Map<String, List<TemplateItem>> triggerMultiMap = new HashMap<>();
    private final List<TemplateItem> allTemplates = new ArrayList<>();

    public synchronized void setTemplates(List<TemplateItem> templates) {
        triggerMultiMap.clear();
        allTemplates.clear();

        if (templates != null) {
            for (TemplateItem item : templates) {
                if (item.trigger != null && !item.trigger.isEmpty() && !item.content.isEmpty()) {
                    String cleanTrig = item.trigger.toLowerCase();
                    List<TemplateItem> list = triggerMultiMap.get(cleanTrig);
                    if (list == null) {
                        list = new ArrayList<>();
                        triggerMultiMap.put(cleanTrig, list);
                    }
                    list.add(item);
                    allTemplates.add(item);
                }
            }
        }
    }

    /**
     * Memeriksa apakah buffer pengetikan cocok dengan pemicu trigger tertentu.
     * Mencari trigger yang PALING PANJANG (longest match) agar /qris tidak pernah tertukar dengan /q.
     */
    public synchronized List<TemplateItem> getMatchesForBuffer(String buffer) {
        if (buffer == null || buffer.isEmpty() || triggerMultiMap.isEmpty()) {
            return Collections.emptyList();
        }

        String lowerBuffer = buffer.toLowerCase();
        String longestMatchKey = null;

        for (String trig : triggerMultiMap.keySet()) {
            if (lowerBuffer.endsWith(trig)) {
                if (longestMatchKey == null || trig.length() > longestMatchKey.length()) {
                    longestMatchKey = trig;
                }
            }
        }

        if (longestMatchKey != null) {
            return triggerMultiMap.get(longestMatchKey);
        }

        return Collections.emptyList();
    }

    /**
     * Memeriksa apakah suatu trigger (misal "/q") merupakan awalan dari trigger lain yang lebih panjang
     * di akun CS (misal "/qris" atau "/quick").
     */
    public synchronized boolean isPrefixOfLongerTrigger(String trig) {
        if (trig == null || trig.isEmpty()) return false;
        String lowerTrig = trig.toLowerCase().trim();

        for (String otherTrig : triggerMultiMap.keySet()) {
            String otherClean = otherTrig.toLowerCase().trim();
            if (otherClean.startsWith(lowerTrig) && otherClean.length() > lowerTrig.length()) {
                return true;
            }
        }
        return false;
    }

    /**
     * Dipanggil saat tombol SPASI ditekan.
     * Memeriksa apakah kata sebelum spasi cocok dengan trigger yang menunggu konfirmasi spasi (seperti /q vs /qris),
     * atau trigger yang memang berakhiran spasi.
     */
    public synchronized List<TemplateItem> checkTriggerOnSpace(String bufferBeforeSpace) {
        if (bufferBeforeSpace == null || bufferBeforeSpace.isEmpty() || triggerMultiMap.isEmpty()) {
            return Collections.emptyList();
        }

        String lower = bufferBeforeSpace.toLowerCase();
        String longestMatchKey = null;

        for (String trig : triggerMultiMap.keySet()) {
            String cleanTrig = trig.trim();
            // Cocok jika buffer berakhiran dengan trigger (baik yang bertrim "/q" maupun "/q ")
            if (lower.endsWith(trig) || lower.endsWith(cleanTrig)) {
                if (longestMatchKey == null || cleanTrig.length() > longestMatchKey.length()) {
                    longestMatchKey = trig;
                }
            }
        }

        if (longestMatchKey != null) {
            return triggerMultiMap.get(longestMatchKey);
        }
        return Collections.emptyList();
    }

    /**
     * Kompatibilitas mundur: mengembalikan item pertama jika cocok
     */
    public synchronized TemplateItem checkTrigger(String buffer) {
        List<TemplateItem> matches = getMatchesForBuffer(buffer);
        if (!matches.isEmpty()) {
            return matches.get(0);
        }
        return null;
    }

    /**
     * Mencari kecocokan template berdasarkan nama tombol HotKey / NUM / F1-F12.
     * Contoh: "F1", "F12", "Ctrl + F1", "Num 1", "Num 0", "Num +", "Home", "End", "PgUp", "PgDn", "Ins", "Del"
     */
    public synchronized List<TemplateItem> findHotkeyMatches(String keyName) {
        List<TemplateItem> matches = new ArrayList<>();
        if (keyName == null || keyName.trim().isEmpty()) return matches;

        String cleanKey = keyName.toLowerCase().replaceAll("[\\s_:\\-\\{\\}\\[\\]\\/\\+]", "");

        for (TemplateItem item : allTemplates) {
            if (item.trigger == null || item.trigger.trim().isEmpty()) continue;
            String itemTrig = item.trigger.toLowerCase().replaceAll("[\\s_:\\-\\{\\}\\[\\]\\/\\+]", "");

            if (itemTrig.equals(cleanKey) ||
                itemTrig.equals("hotkey" + cleanKey) ||
                (itemTrig.endsWith(cleanKey) && (itemTrig.startsWith("hotkey") || itemTrig.startsWith("num") || itemTrig.startsWith("ctrl")))) {
                matches.add(item);
            }
        }
        return matches;
    }

    /**
     * Mencari saran template untuk bilah atas (Quick Strip) saat user sedang mengetik sebagian trigger
     */
    public synchronized List<TemplateItem> findSuggestions(String prefix, int limit) {
        List<TemplateItem> results = new ArrayList<>();
        if (prefix == null || prefix.trim().isEmpty()) {
            int count = 0;
            for (TemplateItem item : allTemplates) {
                results.add(item);
                count++;
                if (count >= limit) break;
            }
            return results;
        }

        String lowerPrefix = prefix.toLowerCase().trim();
        for (TemplateItem item : allTemplates) {
            if (item.trigger.toLowerCase().startsWith(lowerPrefix) ||
                item.name.toLowerCase().contains(lowerPrefix) ||
                item.content.toLowerCase().contains(lowerPrefix)) {
                results.add(item);
                if (results.size() >= limit) break;
            }
        }
        return results;
    }

    public synchronized int getTotalCount() {
        return allTemplates.size();
    }

    public synchronized List<TemplateItem> getAllTemplates() {
        return new ArrayList<>(allTemplates);
    }
}
