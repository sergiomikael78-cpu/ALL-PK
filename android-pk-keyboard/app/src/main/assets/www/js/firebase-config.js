/**
 * Konfigurasi Firebase Realtime Database untuk Sinkronisasi Multi-Device
 * Terhubung permanen ke database proyek: pk-matrix2
 */

window.FIREBASE_CONFIG = {
  databaseURL: "https://pk-matrix2-default-rtdb.firebaseio.com",
  projectId: "pk-matrix2"
};

// Fungsi pembantu untuk membaca konfigurasi (Permanen dari file kode, atau fallback ke LocalStorage)
window.getFirebaseConfig = function() {
  // Prioritas utama: konfigurasi permanen di file ini
  if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.databaseURL) {
    return window.FIREBASE_CONFIG;
  }

  try {
    const saved = localStorage.getItem('PK_FIREBASE_CONFIG');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.databaseURL) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca PK_FIREBASE_CONFIG dari LocalStorage:', e);
  }

  return null;
};
