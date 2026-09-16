package com.pkmatrix.keyboard;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.inputmethodservice.InputMethodService;
import android.inputmethodservice.Keyboard;
import android.inputmethodservice.KeyboardView;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.os.Vibrator;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.view.KeyCharacterMap;
import android.view.KeyEvent;
import android.view.View;
import android.view.inputmethod.InputConnection;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;
import java.util.List;

/**
 * PK KEYBOARD SERVICE (Android Custom IME v1.4)
 * Jantung dari inovasi Text Expansion & Keyboard PC Mobile untuk Customer Service:
 * - Menangani seleksi teks dan penghapusan bersih saat menekan tombol Del/Backspace.
 * - Mode FN dengan PC Editing Cluster dan Numpad NUM lengkap.
 * - Pemicu HotKey/NUM otomatis (misal: 'Num 1' memicu 'Hotkey: Num 1').
 * - Smart Prefix Ambiguity Detection (/q vs /qris): Mencegah trigger pendek membajak trigger panjang.
 * - Space-to-Expand: Tombol Spasi mengekspansi trigger ambigu atau trigger berakhiran spasi.
 * - Bilah CS Quick Action Bar interaktif.
 */
public class PKKeyboardService extends InputMethodService implements KeyboardView.OnKeyboardActionListener {

    private KeyboardView keyboardView;
    private Keyboard keyboard;
    private LinearLayout candidatesContainer;
    private TextView tvBadge;

    public static PKKeyboardService sInstance = null;
    private SpeechRecognizer speechRecognizer;
    private boolean isListeningVoice = false;

    private Keyboard qwertyKeyboard;
    private Keyboard symbolsKeyboard;
    private Keyboard fnKeyboard;

    private static final int MODE_QWERTY = 0;
    private static final int MODE_SYMBOLS = 1;
    private static final int MODE_FN = 2;
    private static final int MAX_BUFFER_SIZE = 35;

    private int currentMode = MODE_QWERTY;
    private boolean isCaps = false;
    private boolean isCtrlActive = false;

    private StringBuilder inputBuffer = new StringBuilder();

    private TriggerEngine triggerEngine;
    private TemplateRepository repository;
    private Vibrator vibrator;
    private ClipboardManager clipboardManager;
    private ClipboardManager.OnPrimaryClipChangedListener clipListener;
    private String lastPastedClip = "";

    // Fitur Tahan Spasi untuk Voice Typing (Hold Space to Voice ala Gboard)
    private final Handler spaceLongPressHandler = new Handler(Looper.getMainLooper());
    private boolean isSpaceLongPressed = false;
    private final Runnable spaceVoiceRunnable = new Runnable() {
        @Override
        public void run() {
            isSpaceLongPressed = true;
            playHapticFeedback(60);
            startVoiceInput();
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        sInstance = this;
        triggerEngine = new TriggerEngine();
        repository = new TemplateRepository(this);
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        clipboardManager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);

        if (clipboardManager != null) {
            clipListener = () -> updateQuickBarPills(inputBuffer.toString());
            try {
                clipboardManager.addPrimaryClipChangedListener(clipListener);
            } catch (Exception ignored) {}
        }

        // Muat template tersimpan
        List<TriggerEngine.TemplateItem> saved = repository.loadLocalTemplates();
        triggerEngine.setTemplates(saved);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (spaceLongPressHandler != null && spaceVoiceRunnable != null) {
            spaceLongPressHandler.removeCallbacks(spaceVoiceRunnable);
        }
        if (speechRecognizer != null) {
            try {
                speechRecognizer.destroy();
            } catch (Exception ignored) {}
            speechRecognizer = null;
        }
        if (sInstance == this) {
            sInstance = null;
        }
        if (clipboardManager != null && clipListener != null) {
            try {
                clipboardManager.removePrimaryClipChangedListener(clipListener);
            } catch (Exception ignored) {}
        }
    }

    @Override
    public View onCreateInputView() {
        View layout = getLayoutInflater().inflate(R.layout.keyboard_view, null);

        keyboardView = layout.findViewById(R.id.keyboard_view);
        candidatesContainer = layout.findViewById(R.id.candidates_container);
        tvBadge = layout.findViewById(R.id.tv_keyboard_badge);

        qwertyKeyboard = new Keyboard(this, R.xml.qwerty);
        symbolsKeyboard = new Keyboard(this, R.xml.symbols);
        fnKeyboard = new Keyboard(this, R.xml.fn_keyboard);

        currentMode = MODE_QWERTY;
        keyboard = qwertyKeyboard;

        keyboardView.setKeyboard(keyboard);
        keyboardView.setOnKeyboardActionListener(this);
        keyboardView.setPreviewEnabled(true);

        // Tombol Buka Pengaturan di header
        View btnSettings = layout.findViewById(R.id.btn_open_settings);
        if (btnSettings != null) {
            btnSettings.setOnClickListener(v -> {
                Intent intent = new Intent(this, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
            });
        }

        // Tombol Voice Keyboard (Speech-to-Text ala Gboard)
        View btnVoiceInput = layout.findViewById(R.id.btn_voice_input);
        if (btnVoiceInput != null) {
            btnVoiceInput.setOnClickListener(v -> {
                playHapticFeedback(30);
                startVoiceInput();
            });
        }

        // Tombol Bersihkan Kolom Input di header (1x Klik Hapus Bersih)
        View btnClearInput = layout.findViewById(R.id.btn_clear_input);
        if (btnClearInput != null) {
            btnClearInput.setOnClickListener(v -> clearInputField());
        }

        // Tampilkan bilah saran awal
        updateQuickBarPills("");
        updateBadge();

        return layout;
    }

    @Override
    public void onStartInputView(android.view.inputmethod.EditorInfo info, boolean restarting) {
        super.onStartInputView(info, restarting);
        inputBuffer.setLength(0);
        isCtrlActive = false;

        // Muat ulang template akun aktif yang dikirim dari web app
        List<TriggerEngine.TemplateItem> current = repository.loadLocalTemplates();
        triggerEngine.setTemplates(current);
        updateQuickBarPills("");
        updateBadge();
        updateEnterKeyLabel(info);
    }

    @Override
    public void onKey(int primaryCode, int[] keyCodes) {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;

        playHapticFeedback(20);

        // Jika CTRL sedang aktif dan tombol huruf ditekan
        if (isCtrlActive && primaryCode > 0) {
            char c = Character.toLowerCase((char) primaryCode);
            isCtrlActive = false;
            updateBadge();

            if (c == 'a') {
                ic.performContextMenuAction(android.R.id.selectAll);
                return;
            } else if (c == 'c') {
                ic.performContextMenuAction(android.R.id.copy);
                return;
            } else if (c == 'v') {
                ic.performContextMenuAction(android.R.id.paste);
                return;
            } else if (c == 'x') {
                ic.performContextMenuAction(android.R.id.cut);
                return;
            } else if (c == 'z') {
                ic.performContextMenuAction(android.R.id.undo);
                return;
            }
        }

        switch (primaryCode) {
            // ==========================================================
            // 1. PENGHAPUSAN TEKS SAAT DIBLOK / DISELEKSI
            // ==========================================================
            case Keyboard.KEYCODE_DELETE: // -5 (Backspace / Delete / Hapus)
                CharSequence selected = ic.getSelectedText(0);
                if (selected != null && selected.length() > 0) {
                    ic.commitText("", 1);
                    inputBuffer.setLength(0);
                } else {
                    if (inputBuffer.length() > 0) {
                        inputBuffer.deleteCharAt(inputBuffer.length() - 1);
                    }
                    ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DEL));
                    ic.sendKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_DEL));
                }
                updateQuickBarPills(inputBuffer.toString());
                break;

            case Keyboard.KEYCODE_SHIFT: // -1 (Shift / Caps)
                if (currentMode == MODE_QWERTY) {
                    isCaps = !isCaps;
                    keyboard.setShifted(isCaps);
                    keyboardView.invalidateAllKeys();
                }
                break;

            case Keyboard.KEYCODE_MODE_CHANGE: // -2 (ABC <-> ?123)
                if (currentMode == MODE_FN || currentMode == MODE_SYMBOLS) {
                    currentMode = MODE_QWERTY;
                    keyboard = qwertyKeyboard;
                } else {
                    currentMode = MODE_SYMBOLS;
                    keyboard = symbolsKeyboard;
                }
                isCtrlActive = false;
                keyboardView.setKeyboard(keyboard);
                keyboard.setShifted(isCaps && currentMode == MODE_QWERTY);
                keyboardView.invalidateAllKeys();
                updateBadge();
                updateEnterKeyLabel(getCurrentInputEditorInfo());
                break;

            // ==========================================================
            // 2. TOMBOL Fn & PC EDITING CLUSTER
            // ==========================================================
            case -3: // Tombol Fn (Beralih Mode PC)
                if (currentMode == MODE_FN) {
                    currentMode = MODE_QWERTY;
                    keyboard = qwertyKeyboard;
                } else {
                    currentMode = MODE_FN;
                    keyboard = fnKeyboard;
                }
                isCtrlActive = false;
                keyboardView.setKeyboard(keyboard);
                keyboardView.invalidateAllKeys();
                updateBadge();
                updateEnterKeyLabel(getCurrentInputEditorInfo());
                break;

            case -114: // CTRL (Toggle Sticky CTRL)
                isCtrlActive = !isCtrlActive;
                updateBadge();
                playHapticFeedback(35);
                break;

            case -115: // HOME
                handleHotkeyOrFallback(ic, "Home", null, KeyEvent.KEYCODE_MOVE_HOME);
                break;

            case -116: // END
                handleHotkeyOrFallback(ic, "End", null, KeyEvent.KEYCODE_MOVE_END);
                break;

            case -117: // PGUP
                handleHotkeyOrFallback(ic, "PgUp", null, KeyEvent.KEYCODE_PAGE_UP);
                break;

            case -118: // PGDN
                handleHotkeyOrFallback(ic, "PgDn", null, KeyEvent.KEYCODE_PAGE_DOWN);
                break;

            case -113: // INS (Insert)
                handleHotkeyOrFallback(ic, "Ins", null, KeyEvent.KEYCODE_INSERT);
                break;

            case -120: // Tombol Bersihkan Kolom Input
                clearInputField();
                break;

            case -121: // Tombol Voice Keyboard (Speech to Text)
                startVoiceInput();
                break;

            case -111: // Tombol Kursor ke Bawah (Move Cursor Down)
                moveCursorDown();
                break;

            case -112: // DEL (Forward Delete / Hapus Cerdas)
                List<TriggerEngine.TemplateItem> delMatches = triggerEngine.findHotkeyMatches("Del");
                if (delMatches != null && !delMatches.isEmpty()) {
                    handleHotkeyOrFallback(ic, "Del", null, 0);
                } else {
                    CharSequence sel = ic.getSelectedText(0);
                    if (sel != null && sel.length() > 0) {
                        ic.commitText("", 1);
                    } else {
                        CharSequence after = ic.getTextAfterCursor(1, 0);
                        if (after != null && after.length() > 0) {
                            sendDownUpKeyEvents(KeyEvent.KEYCODE_FORWARD_DEL);
                        } else {
                            if (inputBuffer.length() > 0) {
                                inputBuffer.deleteCharAt(inputBuffer.length() - 1);
                            }
                            sendDownUpKeyEvents(KeyEvent.KEYCODE_DEL);
                        }
                    }
                    updateQuickBarPills(inputBuffer.toString());
                }
                break;

            case -107: // ESC
                handleHotkeyOrFallback(ic, "Esc", null, KeyEvent.KEYCODE_ESCAPE);
                break;

            case -106: // TAB (\t)
                ic.commitText("\t", 1);
                break;

            case -101: // All (Ctrl + A)
                ic.performContextMenuAction(android.R.id.selectAll);
                break;

            case -102: // Copy (Ctrl + C)
                ic.performContextMenuAction(android.R.id.copy);
                break;

            case -103: // Paste (Ctrl + V)
                ic.performContextMenuAction(android.R.id.paste);
                break;

            // ==========================================================
            // 3. BLOK TOMBOL NUM (Numpad dengan Integrasi Trigger Nyata)
            // ==========================================================
            case -200: // Num 0
                handleHotkeyOrFallback(ic, "Num 0", "0", 0);
                break;

            case -201: // Num 1
                handleHotkeyOrFallback(ic, "Num 1", "1", 0);
                break;

            case -202: // Num 2
                handleHotkeyOrFallback(ic, "Num 2", "2", 0);
                break;

            case -203: // Num 3
                handleHotkeyOrFallback(ic, "Num 3", "3", 0);
                break;

            case -204: // Num 4
                handleHotkeyOrFallback(ic, "Num 4", "4", 0);
                break;

            case -205: // Num 5
                handleHotkeyOrFallback(ic, "Num 5", "5", 0);
                break;

            case -206: // Num 6
                handleHotkeyOrFallback(ic, "Num 6", "6", 0);
                break;

            case -207: // Num 7
                handleHotkeyOrFallback(ic, "Num 7", "7", 0);
                break;

            case -208: // Num 8
                handleHotkeyOrFallback(ic, "Num 8", "8", 0);
                break;

            case -209: // Num 9
                handleHotkeyOrFallback(ic, "Num 9", "9", 0);
                break;

            case -210: // Num /
                handleHotkeyOrFallback(ic, "Num /", "/", 0);
                break;

            case -211: // Num *
                handleHotkeyOrFallback(ic, "Num *", "*", 0);
                break;

            case -212: // Num -
                handleHotkeyOrFallback(ic, "Num -", "-", 0);
                break;

            case -213: // Num .
                handleHotkeyOrFallback(ic, "Num .", ".", 0);
                break;

            case -214: // Num +
                handleHotkeyOrFallback(ic, "Num +", "+", 0);
                break;

            case -215: // Num Enter / Kirim
                List<TriggerEngine.TemplateItem> numEnterMatches = triggerEngine.findHotkeyMatches("Num Enter");
                if (numEnterMatches != null && !numEnterMatches.isEmpty()) {
                    handleHotkeyOrFallback(ic, "Num Enter", null, 0);
                } else {
                    handleEnterOrSend();
                }
                break;

            // ==========================================================
            // 4. BLOK TOMBOL FUNCTION KEYS (F1 - F12 dengan Integrasi Trigger Makro CS)
            // ==========================================================
            case -301: handleFunctionKey(ic, 1, KeyEvent.KEYCODE_F1); break;
            case -302: handleFunctionKey(ic, 2, KeyEvent.KEYCODE_F2); break;
            case -303: handleFunctionKey(ic, 3, KeyEvent.KEYCODE_F3); break;
            case -304: handleFunctionKey(ic, 4, KeyEvent.KEYCODE_F4); break;
            case -305: handleFunctionKey(ic, 5, KeyEvent.KEYCODE_F5); break;
            case -306: handleFunctionKey(ic, 6, KeyEvent.KEYCODE_F6); break;
            case -307: handleFunctionKey(ic, 7, KeyEvent.KEYCODE_F7); break;
            case -308: handleFunctionKey(ic, 8, KeyEvent.KEYCODE_F8); break;
            case -309: handleFunctionKey(ic, 9, KeyEvent.KEYCODE_F9); break;
            case -310: handleFunctionKey(ic, 10, KeyEvent.KEYCODE_F10); break;
            case -311: handleFunctionKey(ic, 11, KeyEvent.KEYCODE_F11); break;
            case -312: handleFunctionKey(ic, 12, KeyEvent.KEYCODE_F12); break;

            // ==========================================================
            // 5. SPACE-TO-EXPAND & SMART DELIMITER
            // ==========================================================
            case 32: // Spasi
                // Jika spasi ditekan lama untuk voice input, abaikan input spasi
                if (isSpaceLongPressed) {
                    isSpaceLongPressed = false;
                    return;
                }

                // Periksa apakah kata sebelum spasi memicu trigger yang menunggu konfirmasi spasi (misal /q vs /qris)
                String currentBuffer = inputBuffer.toString();
                List<TriggerEngine.TemplateItem> spaceMatches = triggerEngine.checkTriggerOnSpace(currentBuffer);

                if (spaceMatches != null && !spaceMatches.isEmpty()) {
                    TriggerEngine.TemplateItem item = spaceMatches.get(0);
                    int deleteLen = item.trigger.trim().length();

                    ic.deleteSurroundingText(deleteLen, 0);
                    ic.commitText(item.content, 1);

                    playHapticFeedback(50);
                    inputBuffer.setLength(0);
                    updateQuickBarPills("");
                    return; // Spasi tidak dimasukkan ke chat karena sudah dikonsumsi sebagai konfirmasi trigger!
                }

                // Jika tidak ada trigger yang menunggu: masukkan spasi normal
                ic.commitText(" ", 1);
                appendBuffer(' ');
                break;

            case 10: // Enter / Kirim
                handleEnterOrSend();
                break;

            default:
                // Karakter huruf / angka / simbol (termasuk '/')
                char code = (char) primaryCode;
                if (Character.isLetter(code) && isCaps && currentMode == MODE_QWERTY) {
                    code = Character.toUpperCase(code);
                }

                // Masukkan karakter ke field aplikasi saat ini
                ic.commitText(String.valueOf(code), 1);

                // Tambahkan ke rolling buffer
                appendBuffer(code);

                // ==============================================================
                // INTI INOVASI: DETEKSI TRIGGER REAL-TIME DENGAN SMART PREFIX
                // ==============================================================
                checkAndExpandTrigger(ic);
                break;
        }
    }

    /**
     * Memeriksa apakah ketikan terakhir cocok dengan trigger pemicu seperti "cek/".
     * Mencegah pemotongan dini jika trigger adalah awalan dari trigger lain (seperti /q vs /qris).
     */
    private void checkAndExpandTrigger(InputConnection ic) {
        String current = inputBuffer.toString();
        List<TriggerEngine.TemplateItem> matches = triggerEngine.getMatchesForBuffer(current);

        if (matches != null && !matches.isEmpty()) {
            TriggerEngine.TemplateItem firstItem = matches.get(0);
            String trig = firstItem.trigger;

            // Periksa apakah trigger ini adalah awalan dari trigger lain yang lebih panjang di akun CS
            boolean isAmbiguousPrefix = triggerEngine.isPrefixOfLongerTrigger(trig);

            if (isAmbiguousPrefix) {
                // Jangan ekspansi instan sekarang, karena CS mungkin sedang mengetik trigger yang lebih panjang (misal /qris).
                // Munculkan pill cerdas di Quick Bar agar CS bisa tekan SPASI untuk /q atau lanjut ketik /qris
                showPrefixConflictPills(trig, matches);
                playHapticFeedback(20);
                return;
            }

            // Jika trigger unik (tidak ada awalan bentrok)
            if (matches.size() == 1) {
                int triggerLen = trig.length();
                ic.deleteSurroundingText(triggerLen, 0);
                ic.commitText(firstItem.content, 1);

                playHapticFeedback(50);
                inputBuffer.setLength(0);
                updateQuickBarPills("");
            } else {
                // Ada variasi kalimat pada trigger ini
                showVariantPills(matches, trig);
                playHapticFeedback(30);
            }
        }
    }

    /**
     * Menampilkan pill cerdas di Quick Bar saat ada ambiguitas awalan (/q vs /qris)
     */
    private void showPrefixConflictPills(String prefixTrig, List<TriggerEngine.TemplateItem> currentMatches) {
        if (candidatesContainer == null) return;
        candidatesContainer.removeAllViews();

        // 1. Pill konfirmasi untuk trigger saat ini (/q)
        if (!currentMatches.isEmpty()) {
            TriggerEngine.TemplateItem item = currentMatches.get(0);
            TextView pillCurrent = new TextView(this);
            pillCurrent.setText("⚡ " + prefixTrig + " (Spasi)");
            pillCurrent.setTextColor(0xFF00FF88); // Neon green
            pillCurrent.setBackgroundColor(0xFF0D3B2A);
            pillCurrent.setTextSize(12f);
            pillCurrent.setPadding(20, 10, 20, 10);

            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            lp.setMargins(6, 0, 6, 0);
            pillCurrent.setLayoutParams(lp);

            pillCurrent.setOnClickListener(v -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null) {
                    ic.deleteSurroundingText(prefixTrig.length(), 0);
                    ic.commitText(item.content, 1);
                    playHapticFeedback(40);
                    inputBuffer.setLength(0);
                    updateQuickBarPills("");
                }
            });
            candidatesContainer.addView(pillCurrent);
        }

        // 2. Pill saran trigger yang lebih panjang (misal /qris)
        List<TriggerEngine.TemplateItem> completions = triggerEngine.findSuggestions(prefixTrig, 4);
        for (TriggerEngine.TemplateItem comp : completions) {
            if (comp.trigger.equalsIgnoreCase(prefixTrig)) continue;

            TextView pill = new TextView(this);
            String label = comp.trigger + " (" + (comp.name.length() > 10 ? comp.name.substring(0, 10) + ".." : comp.name) + ")";
            pill.setText(label);
            pill.setTextColor(0xFF00F2FE); // Cyber cyan
            pill.setBackgroundColor(0xFF141D33);
            pill.setTextSize(12f);
            pill.setPadding(20, 10, 20, 10);

            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            lp.setMargins(6, 0, 6, 0);
            pill.setLayoutParams(lp);

            pill.setOnClickListener(v -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null) {
                    if (inputBuffer.length() > 0) {
                        ic.deleteSurroundingText(inputBuffer.length(), 0);
                        inputBuffer.setLength(0);
                    }
                    ic.commitText(comp.content, 1);
                    playHapticFeedback(40);
                    updateQuickBarPills("");
                }
            });
            candidatesContainer.addView(pill);
        }
    }

    /**
     * Menangani penekanan tombol HotKey / NUM
     */
    private void handleHotkeyOrFallback(InputConnection ic, String hotkeyName, String fallbackText, int fallbackKeyEventCode) {
        List<TriggerEngine.TemplateItem> matches = triggerEngine.findHotkeyMatches(hotkeyName);
        if (matches != null && !matches.isEmpty()) {
            if (matches.size() == 1) {
                TriggerEngine.TemplateItem item = matches.get(0);
                ic.commitText(item.content, 1);
                playHapticFeedback(50);
                inputBuffer.setLength(0);
                updateQuickBarPills("");
            } else {
                showVariantPills(matches, "");
                playHapticFeedback(30);
            }
        } else {
            if (fallbackText != null) {
                ic.commitText(fallbackText, 1);
            } else if (fallbackKeyEventCode != 0) {
                sendDownUpKeyEvents(fallbackKeyEventCode);
            }
        }
    }

    /**
     * Menangani tombol Function Keys F1 s/d F12 dengan dukungan Sticky CTRL dan pemicu makro CS
     */
    private void handleFunctionKey(InputConnection ic, int fNumber, int fallbackKeyEventCode) {
        String fName = "F" + fNumber;
        String hotkeyName = isCtrlActive ? ("Ctrl + " + fName) : fName;
        if (isCtrlActive) {
            isCtrlActive = false;
            updateBadge();
        }
        handleHotkeyOrFallback(ic, hotkeyName, null, fallbackKeyEventCode);
    }

    /**
     * Memindahkan kursor ke baris baru di bawahnya persis seperti SHIFT + ENTER pada keyboard PC.
     * Mencegah pengiriman pesan otomatis pada aplikasi LiveChat, WhatsApp, web chat, dll.
     */
    private void moveCursorDown() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;

        playHapticFeedback(40);

        long eventTime = SystemClock.uptimeMillis();
        int metaShift = KeyEvent.META_SHIFT_ON | KeyEvent.META_SHIFT_LEFT_ON;
        int flags = KeyEvent.FLAG_SOFT_KEYBOARD | KeyEvent.FLAG_KEEP_TOUCH_MODE;

        // 1. Tekan Shift (ACTION_DOWN dengan META_SHIFT_ON)
        KeyEvent shiftDown = new KeyEvent(eventTime, eventTime, KeyEvent.ACTION_DOWN, 
                KeyEvent.KEYCODE_SHIFT_LEFT, 0, metaShift, KeyCharacterMap.VIRTUAL_KEYBOARD, 0, flags);

        // 2. Tekan Enter bersamaan dengan Shift aktif (KeyDown Enter with Shift)
        KeyEvent enterDown = new KeyEvent(eventTime, eventTime, KeyEvent.ACTION_DOWN, 
                KeyEvent.KEYCODE_ENTER, 0, metaShift, KeyCharacterMap.VIRTUAL_KEYBOARD, 0, flags);

        // 3. Lepas Enter
        KeyEvent enterUp = new KeyEvent(eventTime, eventTime, KeyEvent.ACTION_UP, 
                KeyEvent.KEYCODE_ENTER, 0, metaShift, KeyCharacterMap.VIRTUAL_KEYBOARD, 0, flags);

        // 4. Lepas Shift
        KeyEvent shiftUp = new KeyEvent(eventTime, eventTime, KeyEvent.ACTION_UP, 
                KeyEvent.KEYCODE_SHIFT_LEFT, 0, 0, KeyCharacterMap.VIRTUAL_KEYBOARD, 0, flags);

        // Kirim rangkaian event Shift+Enter
        ic.sendKeyEvent(shiftDown);
        ic.sendKeyEvent(enterDown);
        ic.sendKeyEvent(enterUp);
        ic.sendKeyEvent(shiftUp);

        // Reset buffer trigger dan perbarui kandidat
        inputBuffer.setLength(0);
        updateQuickBarPills("");
    }

    /**
     * Membersihkan seluruh isi kolom input dalam 1x klik (Clear All)
     */
    private void clearInputField() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;

        playHapticFeedback(50);

        // Langkah 1: Coba select all dan timpa dengan string kosong (standar Android)
        ic.performContextMenuAction(android.R.id.selectAll);
        ic.commitText("", 1);

        // Langkah 2: Sapu bersih jika aplikasi tidak merespon select all
        CharSequence before = ic.getTextBeforeCursor(5000, 0);
        CharSequence after = ic.getTextAfterCursor(5000, 0);
        int bLen = before != null ? before.length() : 0;
        int aLen = after != null ? after.length() : 0;
        if (bLen > 0 || aLen > 0) {
            ic.deleteSurroundingText(bLen, aLen);
        }

        // Reset buffer trigger
        inputBuffer.setLength(0);

        // Umpan balik visual langsung di CS Quick Bar
        showTemporaryQuickBarMessage("🗑️ Kolom Dibersihkan");
    }

    /**
     * Menampilkan pesan konfirmasi singkat di Quick Bar
     */
    private void showTemporaryQuickBarMessage(String message) {
        if (candidatesContainer == null) return;
        candidatesContainer.removeAllViews();

        TextView pill = new TextView(this);
        pill.setText(message);
        pill.setTextColor(0xFF00E676); // Hijau cerah
        pill.setBackgroundColor(0xFF141D33);
        pill.setTextSize(12f);
        pill.setPadding(24, 10, 24, 10);
        candidatesContainer.addView(pill);

        candidatesContainer.postDelayed(() -> {
            updateQuickBarPills(inputBuffer.toString());
        }, 1200);
    }

    /**
     * Memasukkan hasil suara ke aplikasi aktif
     */
    public static void commitVoiceText(String text) {
        if (sInstance != null && text != null && !text.trim().isEmpty()) {
            InputConnection ic = sInstance.getCurrentInputConnection();
            if (ic != null) {
                ic.commitText(text.trim() + " ", 1);
            }
            sInstance.showTemporaryQuickBarMessage("🎙️ \"" + (text.length() > 20 ? text.substring(0, 20) + ".." : text) + "\"");
        }
    }

    /**
     * Memulai pengetikan suara (Voice Keyboard ala Gboard)
     */
    private void startVoiceInput() {
        playHapticFeedback(40);

        if (isListeningVoice) {
            stopVoiceInput();
            return;
        }

        // Periksa izin mikrofon
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            Intent intent = new Intent(this, VoiceInputActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
            return;
        }

        // Coba jalankan SpeechRecognizer langsung di dalam service keyboard jika didukung
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            startDirectSpeechRecognizer();
        } else {
            // Fallback ke VoiceInputActivity (Google Recognition)
            Intent intent = new Intent(this, VoiceInputActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        }
    }

    private void stopVoiceInput() {
        isListeningVoice = false;
        if (speechRecognizer != null) {
            try {
                speechRecognizer.stopListening();
                speechRecognizer.cancel();
            } catch (Exception ignored) {}
        }
        updateQuickBarPills(inputBuffer.toString());
    }

    private void startDirectSpeechRecognizer() {
        try {
            if (speechRecognizer != null) {
                speechRecognizer.destroy();
                speechRecognizer = null;
            }

            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override
                public void onReadyForSpeech(Bundle params) {
                    isListeningVoice = true;
                    showVoiceListeningBar();
                }

                @Override
                public void onBeginningOfSpeech() {}

                @Override
                public void onRmsChanged(float rmsdB) {}

                @Override
                public void onBufferReceived(byte[] buffer) {}

                @Override
                public void onEndOfSpeech() {
                    isListeningVoice = false;
                    showTemporaryQuickBarMessage("⏳ Menerjemahkan Suara...");
                }

                @Override
                public void onError(int error) {
                    isListeningVoice = false;
                    if (candidatesContainer != null) {
                        updateQuickBarPills(inputBuffer.toString());
                    }
                    if (error == SpeechRecognizer.ERROR_NO_MATCH ||
                        error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                        showTemporaryQuickBarMessage("🎙️ Tidak ada suara terdeteksi");
                    } else if (error != SpeechRecognizer.ERROR_CLIENT) {
                        // Fallback ke VoiceInputActivity
                        Intent intent = new Intent(PKKeyboardService.this, VoiceInputActivity.class);
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    }
                }

                @Override
                public void onResults(Bundle results) {
                    isListeningVoice = false;
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches != null && !matches.isEmpty()) {
                        commitVoiceText(matches.get(0));
                    } else {
                        updateQuickBarPills(inputBuffer.toString());
                    }
                }

                @Override
                public void onPartialResults(Bundle partialResults) {
                    ArrayList<String> partial = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (partial != null && !partial.isEmpty()) {
                        showVoiceLiveText(partial.get(0));
                    }
                }

                @Override
                public void onEvent(int eventType, Bundle params) {}
            });

            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "id-ID");
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);

            speechRecognizer.startListening(intent);
            isListeningVoice = true;
            showVoiceListeningBar();
        } catch (Exception e) {
            Intent intent = new Intent(this, VoiceInputActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        }
    }

    private void showVoiceListeningBar() {
        if (candidatesContainer == null) return;
        candidatesContainer.removeAllViews();

        TextView pill = new TextView(this);
        pill.setText("🎙️ Mendengarkan... (Bicara sekarang)");
        pill.setTextColor(0xFF00E676);
        pill.setBackgroundColor(0xFF141D33);
        pill.setTextSize(12f);
        pill.setPadding(24, 10, 16, 10);
        candidatesContainer.addView(pill);

        TextView btnCancel = new TextView(this);
        btnCancel.setText("✖ Batal");
        btnCancel.setTextColor(0xFFF43F5E);
        btnCancel.setBackgroundColor(0xFF1E293B);
        btnCancel.setTextSize(12f);
        btnCancel.setPadding(16, 10, 24, 10);
        btnCancel.setOnClickListener(v -> stopVoiceInput());
        candidatesContainer.addView(btnCancel);
    }

    private void showVoiceLiveText(String liveText) {
        if (candidatesContainer == null) return;
        candidatesContainer.removeAllViews();

        TextView pill = new TextView(this);
        pill.setText("🎙️ " + liveText);
        pill.setTextColor(0xFF00F2FE);
        pill.setBackgroundColor(0xFF141D33);
        pill.setTextSize(12f);
        pill.setPadding(24, 10, 24, 10);
        candidatesContainer.addView(pill);
    }

    /**
     * Menangani aksi tombol Enter / Kirim cerdas sesuai konteks aplikasi (WhatsApp, Chat, Form, dll)
     */
    private void handleEnterOrSend() {
        InputConnection ic = getCurrentInputConnection();
        if (ic == null) return;

        playHapticFeedback(40);
        inputBuffer.setLength(0);
        updateQuickBarPills("");

        android.view.inputmethod.EditorInfo info = getCurrentInputEditorInfo();
        if (info != null) {
            boolean isMultiLine = (info.inputType & android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE) != 0;
            int action = info.imeOptions & (android.view.inputmethod.EditorInfo.IME_MASK_ACTION | android.view.inputmethod.EditorInfo.IME_FLAG_NO_ENTER_ACTION);
            boolean noEnterAction = (info.imeOptions & android.view.inputmethod.EditorInfo.IME_FLAG_NO_ENTER_ACTION) != 0;

            // Jika field input mendukung multi-baris (misal catatan, email, chat multiline), prioritaskan baris baru (\n)
            if (isMultiLine && (action == 0 || action == android.view.inputmethod.EditorInfo.IME_ACTION_NONE || action == android.view.inputmethod.EditorInfo.IME_ACTION_UNSPECIFIED)) {
                ic.commitText("\n", 1);
                return;
            }

            if (action != 0 && !noEnterAction) {
                boolean handled = ic.performEditorAction(action);
                if (handled) return;
            }
        }

        // Fallback: sisipkan newline (\n) dan kirim KeyEvent ENTER native
        boolean committed = ic.commitText("\n", 1);
        if (!committed) {
            sendDownUpKeyEvents(KeyEvent.KEYCODE_ENTER);
        }
    }

    /**
     * Memperbarui label tombol Enter/Kirim secara dinamis sesuai konteks aplikasi (Kirim, Cari, Selesai, Go)
     */
    private void updateEnterKeyLabel(android.view.inputmethod.EditorInfo info) {
        String label = "↵ Kirim";
        if (info != null) {
            int action = info.imeOptions & android.view.inputmethod.EditorInfo.IME_MASK_ACTION;
            switch (action) {
                case android.view.inputmethod.EditorInfo.IME_ACTION_SEARCH:
                    label = "🔍 Cari";
                    break;
                case android.view.inputmethod.EditorInfo.IME_ACTION_GO:
                    label = "Go";
                    break;
                case android.view.inputmethod.EditorInfo.IME_ACTION_SEND:
                    label = "↵ Kirim";
                    break;
                case android.view.inputmethod.EditorInfo.IME_ACTION_NEXT:
                    label = "Lanjut";
                    break;
                case android.view.inputmethod.EditorInfo.IME_ACTION_DONE:
                    label = "Selesai";
                    break;
                default:
                    label = "↵ Kirim";
                    break;
            }
        }

        setKeyLabel(qwertyKeyboard, 10, label);
        setKeyLabel(symbolsKeyboard, 10, label);
        if (keyboardView != null) {
            keyboardView.invalidateAllKeys();
        }
    }

    private void setKeyLabel(Keyboard kb, int primaryCode, String label) {
        if (kb == null) return;
        List<Keyboard.Key> keys = kb.getKeys();
        if (keys != null) {
            for (Keyboard.Key k : keys) {
                if (k.codes != null && k.codes.length > 0 && k.codes[0] == primaryCode) {
                    k.label = label;
                    break;
                }
            }
        }
    }

    private void appendBuffer(char c) {
        if (inputBuffer.length() >= MAX_BUFFER_SIZE) {
            inputBuffer.delete(0, 5); // Ring buffer trim
        }
        inputBuffer.append(c);
        updateQuickBarPills(inputBuffer.toString());
    }

    /**
     * Menampilkan pill variasi kalimat untuk trigger yang memiliki 2 atau 3 kalimat/varian
     */
    private void showVariantPills(List<TriggerEngine.TemplateItem> matches, String triggerText) {
        if (candidatesContainer == null || matches == null || matches.isEmpty()) return;
        candidatesContainer.removeAllViews();

        int index = 1;
        final StringBuilder combinedText = new StringBuilder();

        for (TriggerEngine.TemplateItem item : matches) {
            if (combinedText.length() > 0) combinedText.append("\n");
            combinedText.append(item.content);

            TextView pill = new TextView(this);
            String snippet = item.content.length() > 20 ? item.content.substring(0, 20) + ".." : item.content;
            snippet = snippet.replace('\n', ' ');
            String label = "Kalimat " + index + ": " + snippet;
            pill.setText(label);
            pill.setTextColor(0xFF00F2FE); // Cyber cyan
            pill.setBackgroundColor(0xFF1B2848); // Elevated button
            pill.setTextSize(12f);
            pill.setPadding(20, 10, 20, 10);

            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            lp.setMargins(6, 0, 6, 0);
            pill.setLayoutParams(lp);

            final TriggerEngine.TemplateItem selectedItem = item;
            pill.setOnClickListener(v -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null) {
                    if (triggerText != null && triggerText.length() > 0) {
                        ic.deleteSurroundingText(triggerText.length(), 0);
                    }
                    ic.commitText(selectedItem.content, 1);
                    playHapticFeedback(40);
                    inputBuffer.setLength(0);
                    updateQuickBarPills("");
                }
            });

            candidatesContainer.addView(pill);
            index++;
        }

        // Tambahkan tombol [Gabung Semua] jika lebih dari 1 kalimat
        if (matches.size() > 1) {
            TextView btnMerge = new TextView(this);
            btnMerge.setText("➕ Gabung Semua");
            btnMerge.setTextColor(0xFF00FF88); // Neon green
            btnMerge.setBackgroundColor(0xFF0A3A2A);
            btnMerge.setTextSize(12f);
            btnMerge.setPadding(20, 10, 20, 10);

            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            lp.setMargins(6, 0, 6, 0);
            btnMerge.setLayoutParams(lp);

            btnMerge.setOnClickListener(v -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null) {
                    if (triggerText != null && triggerText.length() > 0) {
                        ic.deleteSurroundingText(triggerText.length(), 0);
                    }
                    ic.commitText(combinedText.toString(), 1);
                    playHapticFeedback(50);
                    inputBuffer.setLength(0);
                    updateQuickBarPills("");
                }
            });

            candidatesContainer.addView(btnMerge);
        }
    }

    /**
     * Membaca teks terbaru dari clipboard perangkat
     */
    private String getRecentClipboardText() {
        if (clipboardManager == null) return null;
        try {
            if (clipboardManager.hasPrimaryClip()) {
                ClipData clip = clipboardManager.getPrimaryClip();
                if (clip != null && clip.getItemCount() > 0) {
                    CharSequence cs = clip.getItemAt(0).coerceToText(this);
                    if (cs != null && cs.length() > 0) {
                        String s = cs.toString().trim();
                        if (!s.isEmpty()) {
                            return s;
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Memperbarui tombol-tombol bilah pintas di atas keyboard (CS Quick Bar)
     */
    private void updateQuickBarPills(String prefix) {
        if (candidatesContainer == null) return;
        candidatesContainer.removeAllViews();

        // 1. TAMPILKAN PRATINJAU CLIPBOARD JIKA ADA TEKS YANG BARU DISALIN
        final String clipText = getRecentClipboardText();
        if (clipText != null && !clipText.isEmpty()) {
            TextView pillClip = new TextView(this);
            String snippet = clipText.length() > 20 ? clipText.substring(0, 20) + ".." : clipText;
            snippet = snippet.replace('\n', ' ');
            pillClip.setText("📋 " + snippet);
            pillClip.setTextColor(0xFF001122); // Dark text on bright badge
            pillClip.setBackgroundColor(0xFF00F2FE); // Bright Cyber Cyan
            pillClip.setTextSize(12f);
            pillClip.setTypeface(null, android.graphics.Typeface.BOLD);
            pillClip.setPadding(24, 10, 24, 10);

            LinearLayout.LayoutParams lpClip = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            lpClip.setMargins(6, 0, 10, 0);
            pillClip.setLayoutParams(lpClip);

            pillClip.setOnClickListener(v -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null) {
                    ic.commitText(clipText, 1);
                    playHapticFeedback(40);
                    lastPastedClip = clipText;
                    pillClip.setText("✓ Ditempel");
                    pillClip.setBackgroundColor(0xFF00FF88); // Neon green feedback
                    pillClip.postDelayed(() -> updateQuickBarPills(inputBuffer.toString()), 1000);
                }
            });

            candidatesContainer.addView(pillClip);
        }

        // 2. TAMPILKAN SARAN TEMPLATE
        List<TriggerEngine.TemplateItem> suggestions = triggerEngine.findSuggestions(prefix, 8);
        for (TriggerEngine.TemplateItem item : suggestions) {
            TextView pill = new TextView(this);
            String title = item.trigger.isEmpty() ? item.name : item.trigger;
            String snippet = item.content.length() > 14 ? item.content.substring(0, 14) + ".." : item.content;
            snippet = snippet.replace('\n', ' ');
            String label = title + " (" + snippet + ")";
            pill.setText(label);
            pill.setTextColor(0xFF00F2FE); // Cyber cyan
            pill.setBackgroundColor(0xFF141D33); // Elevated dark
            pill.setTextSize(12f);
            pill.setPadding(20, 10, 20, 10);

            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            lp.setMargins(6, 0, 6, 0);
            pill.setLayoutParams(lp);

            pill.setOnClickListener(v -> {
                InputConnection ic = getCurrentInputConnection();
                if (ic != null) {
                    if (inputBuffer.length() > 0) {
                        ic.deleteSurroundingText(inputBuffer.length(), 0);
                        inputBuffer.setLength(0);
                    }
                    ic.commitText(item.content, 1);
                    playHapticFeedback(35);
                    updateQuickBarPills("");
                }
            });

            candidatesContainer.addView(pill);
        }
    }

    private void updateBadge() {
        if (tvBadge != null) {
            if (isCtrlActive) {
                tvBadge.setText("⚡ CTRL");
            } else if (currentMode == MODE_FN) {
                tvBadge.setText("⚡ FN");
            } else if (currentMode == MODE_SYMBOLS) {
                tvBadge.setText("⚡ 123");
            } else {
                tvBadge.setText("⚡ PK");
            }
        }
    }

    private void playHapticFeedback(int durationMs) {
        if (vibrator != null && vibrator.hasVibrator()) {
            try {
                vibrator.vibrate(durationMs);
            } catch (Exception ignored) {}
        }
    }

    @Override
    public void onPress(int primaryCode) {
        // Balon preview tuts melayang ala iPhone: aktif untuk huruf, angka, dan simbol; senyap untuk tombol kontrol
        if (keyboardView != null) {
            if (primaryCode == 32 || primaryCode == -1 || primaryCode == -5 || primaryCode == 10 
                    || primaryCode == -2 || primaryCode == -3 || primaryCode == -111 || primaryCode == -114 || primaryCode == -215 || primaryCode == -121) {
                keyboardView.setPreviewEnabled(false);
            } else {
                keyboardView.setPreviewEnabled(true);
            }
        }

        // Fitur Tahan Spasi untuk Voice Typing (Hold Space to Voice ala Gboard)
        if (primaryCode == 32) {
            isSpaceLongPressed = false;
            spaceLongPressHandler.removeCallbacks(spaceVoiceRunnable);
            spaceLongPressHandler.postDelayed(spaceVoiceRunnable, 500);
        }

        playHapticFeedback(15);
    }

    @Override
    public void onRelease(int primaryCode) {
        if (primaryCode == 32) {
            spaceLongPressHandler.removeCallbacks(spaceVoiceRunnable);
        }
        if (keyboardView != null) {
            keyboardView.setPreviewEnabled(true);
        }
    }

    @Override public void onText(CharSequence text) {}
    @Override public void swipeLeft() {}
    @Override public void swipeRight() {}
    @Override public void swipeDown() {}
    @Override public void swipeUp() {}
}
