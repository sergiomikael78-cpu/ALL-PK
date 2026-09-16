package com.pkmatrix.keyboard;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.util.ArrayList;

/**
 * VOICE INPUT ACTIVITY - GOOGLE SPEECH TO TEXT BRIDGE
 * Menangani izin mikrofon runtime dan menjalankan dialog Speech Recognition resmi Google.
 * Berjalan sebagai activity transparan tanpa animasi, mengirim hasil suara langsung ke PKKeyboardService.
 */
public class VoiceInputActivity extends AppCompatActivity {

    private static final int REQ_AUDIO_PERMISSION = 1001;
    private static final int REQ_SPEECH_RECOG = 1002;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Periksa izin mikrofon
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                    this,
                    new String[]{Manifest.permission.RECORD_AUDIO},
                    REQ_AUDIO_PERMISSION
            );
        } else {
            startSpeechRecognition();
        }
    }

    private void startSpeechRecognition() {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "id-ID");
        intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "🎙️ Silakan bicara... (PK Keyboard CS)");
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);

        try {
            startActivityForResult(intent, REQ_SPEECH_RECOG);
        } catch (Exception e) {
            Toast.makeText(this, "Layanan suara tidak tersedia pada perangkat ini.", Toast.LENGTH_SHORT).show();
            finish();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_AUDIO_PERMISSION) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startSpeechRecognition();
            } else {
                Toast.makeText(this, "Izin mikrofon dibutuhkan untuk fitur suara keyboard.", Toast.LENGTH_LONG).show();
                finish();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_SPEECH_RECOG && resultCode == RESULT_OK && data != null) {
            ArrayList<String> matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (matches != null && !matches.isEmpty()) {
                String resultText = matches.get(0);
                PKKeyboardService.commitVoiceText(resultText);
            }
        }
        finish();
    }

    @Override
    public void finish() {
        super.finish();
        // Tanpa animasi agar kembali ke keyboard seketika
        overridePendingTransition(0, 0);
    }
}
