/**
 * ANDROID BRIDGE CONTROLLER
 * Menghubungkan Web PK Matrix Vault dengan sistem Android Native & Layanan Keyboard.
 * Berjalan otomatis ketika aplikasi dibuka di dalam APK Android.
 */

(function () {
  'use strict';

  const AndroidBridge = {
    // Cek apakah web berjalan di dalam aplikasi Android APK
    isInsideApp: function () {
      return typeof window.AndroidNativeBridge !== 'undefined';
    },

    // Kirim data template aktif ke keyboard Android
    syncToKeyboard: function (userId, templates) {
      if (!this.isInsideApp()) return;

      try {
        const cleanUser = userId || (window.WorkspaceManager ? window.WorkspaceManager.getCurrentUser() : 'default') || 'default';
        const jsonStr = JSON.stringify(templates || []);
        window.AndroidNativeBridge.syncActiveUserTemplates(cleanUser, jsonStr);
        console.log(`[AndroidBridge] Sinkronisasi ${templates ? templates.length : 0} template user '${cleanUser}' ke keyboard native sukses.`);
      } catch (e) {
        console.error('[AndroidBridge] Gagal sinkronisasi ke keyboard native:', e);
      }
    },

    // Buka pengaturan keyboard Android
    openKeyboardSettings: function () {
      if (this.isInsideApp() && window.AndroidNativeBridge.openKeyboardSettings) {
        window.AndroidNativeBridge.openKeyboardSettings();
      }
    },

    // Buka pemilih keyboard aktif
    showKeyboardPicker: function () {
      if (this.isInsideApp() && window.AndroidNativeBridge.showKeyboardPicker) {
        window.AndroidNativeBridge.showKeyboardPicker();
      }
    },

    // Periksa status aktivasi keyboard
    isKeyboardEnabled: function () {
      if (this.isInsideApp() && window.AndroidNativeBridge.isKeyboardEnabled) {
        return window.AndroidNativeBridge.isKeyboardEnabled();
      }
      return false;
    }
  };

  // Pasang listener pada WorkspaceManager saat user login / ganti akun
  function hookWorkspaceEvents() {
    if (window.WorkspaceManager) {
      window.WorkspaceManager.addListener((userId) => {
        console.log('[AndroidBridge] Akun berubah menjadi:', userId);
        
        // Baca template tersimpan untuk user baru ini
        const storageKey = window.WorkspaceManager.getStorageKey('TEMPLATES');
        let currentTemplates = [];
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) currentTemplates = JSON.parse(raw);
        } catch (e) {}

        AndroidBridge.syncToKeyboard(userId, currentTemplates);
      });
    }
  }

  // Hook otomatis saat templates disimpan di app.js
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);

    // Jika key yang disimpan berkaitan dengan template akun aktif
    if (key && (key.includes('TEMPLATES') || key === 'PK_MASTER_TEMPLATES')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const activeUser = window.WorkspaceManager ? window.WorkspaceManager.getCurrentUser() : 'default';
          AndroidBridge.syncToKeyboard(activeUser, parsed);
        }
      } catch (err) {}
    }
  };

  // Expose ke global window
  window.AndroidBridge = AndroidBridge;

  // Jalankan inisialisasi saat DOM siap
  document.addEventListener('DOMContentLoaded', () => {
    hookWorkspaceEvents();

    // Jika di dalam APK, tampilkan banner notifikasi keyboard jika belum aktif
    if (AndroidBridge.isInsideApp()) {
      console.log('[AndroidBridge] Berjalan di dalam Aplikasi APK Native PK Keyboard!');
      
      // Sinkronkan data awal
      setTimeout(() => {
        const activeUser = window.WorkspaceManager ? window.WorkspaceManager.getCurrentUser() : 'default';
        const storageKey = window.WorkspaceManager ? window.WorkspaceManager.getStorageKey('TEMPLATES') : 'PK_MASTER_TEMPLATES';
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            AndroidBridge.syncToKeyboard(activeUser, JSON.parse(raw));
          }
        } catch (e) {}
      }, 500);
    }
  });

})();
