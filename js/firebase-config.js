/**
 * Konfigurasi Firebase Realtime Database untuk Sinkronisasi Multi-Device
 */

window.FIREBASE_CONFIG = {
  databaseURL: "https://pk-matrix-sync-default-rtdb.firebaseio.com",
  projectId: "pk-matrix-sync"
};

// Fungsi pembantu untuk membaca konfigurasi (dari file atau dari LocalStorage jika diatur via UI)
window.getFirebaseConfig = function() {
  try {
    const saved = localStorage.getItem('PK_FIREBASE_CONFIG');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.databaseURL || parsed.apiKey)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca PK_FIREBASE_CONFIG dari LocalStorage:', e);
  }
  
  if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.databaseURL) {
    return window.FIREBASE_CONFIG;
  }
  
  return null;
};
