/**
 * WORKSPACE & MULTI-USER MANAGER
 * Mengelola ruang kerja terisolasi untuk setiap pengguna (Multi-Tenant).
 * Pendaftaran & Login instan: Cukup User ID & Password seragam ('1').
 * Menyediakan key penyimpanan terisolasi dan path Firebase terisolasi.
 */

(function () {
  'use strict';

  const MASTER_PASSWORD = '1';
  const ACTIVE_USER_KEY = 'PK_ACTIVE_USER_ID';
  const RECENT_USERS_KEY = 'PK_RECENT_USERS_LIST';

  const listeners = [];

  // Sanitasi User ID agar aman untuk path Firebase dan LocalStorage
  function sanitizeUserId(id) {
    if (!id || typeof id !== 'string') return '';
    return id.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
  }

  const WorkspaceManager = {
    /**
     * Dapatkan password master saat ini
     */
    getMasterPassword: function () {
      return MASTER_PASSWORD;
    },

    /**
     * Ambil User ID aktif saat ini
     */
    getCurrentUser: function () {
      const user = localStorage.getItem(ACTIVE_USER_KEY);
      return user ? sanitizeUserId(user) : null;
    },

    /**
     * Dapatkan nama tampilan user (bebas kapitalisasi)
     */
    getCurrentUserDisplay: function () {
      const user = this.getCurrentUser();
      if (!user) return 'Tamu (Belum Masuk)';
      return user.toUpperCase();
    },

    /**
     * Cek apakah user sudah login
     */
    isLoggedIn: function () {
      return !!this.getCurrentUser();
    },

    /**
     * Login atau Daftar Akun dengan User ID dan Password
     * @param {string} rawUserId 
     * @param {string} password 
     * @returns {{ success: boolean, message: string, user?: string }}
     */
    login: function (rawUserId, password) {
      const cleanId = sanitizeUserId(rawUserId);
      if (!cleanId || cleanId.length < 2) {
        return {
          success: false,
          message: 'User ID minimal 2 karakter (huruf/angka/garis bawah).'
        };
      }

      if (String(password).trim() !== MASTER_PASSWORD) {
        return {
          success: false,
          message: 'Password salah! Gunakan password seragam: ' + MASTER_PASSWORD
        };
      }

      // Simpan user aktif
      localStorage.setItem(ACTIVE_USER_KEY, cleanId);

      // Simpan ke daftar riwayat user di perangkat ini
      this._addToRecentUsers(cleanId);

      // Picu listener perubahan auth
      this._notifyListeners(cleanId);

      return {
        success: true,
        message: `Berhasil masuk sebagai ${cleanId}!`,
        user: cleanId
      };
    },

    /**
     * Keluar dari akun (Logout)
     */
    logout: function () {
      localStorage.removeItem(ACTIVE_USER_KEY);
      this._notifyListeners(null);
    },

    /**
     * Ambil key penyimpanan LocalStorage yang terisolasi untuk user aktif
     * @param {string} baseKey e.g. 'PK_TEMPLATES'
     */
    getStorageKey: function (baseKey) {
      const user = this.getCurrentUser() || 'guest';
      return `PK_WS_${user}_${baseKey}`;
    },

    /**
     * Ambil path Firebase Realtime Database yang terisolasi untuk user aktif
     * @param {string} collection e.g. 'pk_templates' atau 'keep_notes'
     */
    getFirebasePath: function (collection) {
      const user = this.getCurrentUser() || 'guest';
      return `workspaces/${user}/${collection}`;
    },

    /**
     * Dapatkan daftar User ID yang pernah login di perangkat ini
     */
    getRecentUsers: function () {
      try {
        const data = localStorage.getItem(RECENT_USERS_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    },

    _addToRecentUsers: function (userId) {
      try {
        let list = this.getRecentUsers();
        list = list.filter(u => u !== userId);
        list.unshift(userId);
        if (list.length > 8) list = list.slice(0, 8);
        localStorage.setItem(RECENT_USERS_KEY, JSON.stringify(list));
      } catch (e) {}
    },

    /**
     * Daftarkan listener saat ada pergantian user / login / logout
     * @param {Function} callback (newUserId)
     */
    onAuthChange: function (callback) {
      if (typeof callback === 'function') {
        listeners.push(callback);
      }
    },

    _notifyListeners: function (newUserId) {
      listeners.forEach(cb => {
        try {
          cb(newUserId);
        } catch (err) {
          console.error('Error in Workspace onAuthChange listener:', err);
        }
      });
    },

    /**
     * Kosongkan seluruh data workspace, akun, template, dan catatan di LocalStorage
     */
    clearAllLocalData: function () {
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('PK_') || k.startsWith('PK_WS_'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.removeItem(ACTIVE_USER_KEY);
        localStorage.removeItem(RECENT_USERS_KEY);
      } catch (e) {
        console.error('Gagal membersihkan data local:', e);
      }
    }
  };

  window.WorkspaceManager = WorkspaceManager;
})();
