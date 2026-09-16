# Panduan Lengkap: All-in-One PK Matrix Mobile & Keyboard Android

Aplikasi Android mandiri (**Single APK CS Super-App**) yang menggabungkan seluruh sistem pengelolaan **PK Matrix Vault** dengan **Layanan Keyboard Android Sistem (Custom IME)** berteknologi **Auto Text-Expansion**:
- Seluruh pengaturan, penambahan template, Keep Notes, dan import XML dilakukan langsung **di dalam aplikasi ini**.
- Keyboard Android menggunakan **Mode Kompak (4 Baris Standar)** dengan tombol slash (`/`) pemicu cepat di samping spasi.
- **Akun & Data yang Sudah Ada Langsung Terhubung Otomatis**: Cukup login dengan User ID lama Anda (misal `budi`, `cs01`) dan password `1`, seluruh data template Anda langsung ditarik dari Firebase dan aktif di keyboard!

---

## 🌟 Fitur Unggulan

1. **All-in-One Super-App (Satu Aplikasi untuk Semua)**:
   - Tidak memerlukan browser luar lagi. Aplikasi APK ini memuat antarmuka Cyber HUD PK Matrix secara offline-ready dan ultra-cepat.
2. **Konektivitas Akun & Data yang Sudah Ada (100% Terhubung)**:
   - Terhubung langsung ke cloud Firebase Realtime Database: `workspaces/{User_ID}/pk_templates`.
   - Saat Anda login dengan User ID akun Anda di dalam app, keyboard di HP Anda **seketika membaca dan mengaktifkan template akun tersebut**.
   - Jika berganti staf di HP yang sama (misal dari `budi` ganti ke `siti`), keyboard otomatis berganti mengikuti template milik `siti`.
3. **Keyboard Mode Kompak (4 Baris Standar Khusus CS)**:
   - **Baris 1**: `q w e r t y u i o p`
   - **Baris 2**: `a s d f g h j k l`
   - **Baris 3**: `Shift ⇧`, `z x c v b n m`, `Backspace ⌫`
   - **Baris 4 (Bawah)**: `?123 (Simbol/Angka)`, `Slash (/) (Pemicu Utama)`, `Spasi Lebar`, `Titik (.)`, `Enter ↵`
   - **CS Quick Bar (Bilah Pintas Atas)**: Tombol-tombol kategori (Deposit, WD, Salam, Kendala, Closing) dan saran pemicu real-time.
4. **Live Trigger Expansion (`cek/`, `dp/`, `wd/`, dll.)**:
   - Memonitor keystroke tanpa jeda (< 2ms).
   - Mengetik `cek/` di aplikasi LiveChat, WhatsApp, atau Chrome otomatis terhapus dan terganti menjadi kalimat respon lengkap!

---

## 🚀 Cara Kompilasi & Membuat File APK

### Metode 1: Menggunakan Android Studio (Paling Mudah)
1. Buka **Android Studio**.
2. Pilih **File > Open**, lalu arahkan ke folder `android-pk-keyboard`.
3. Tunggu Gradle selesai melakukan sinkronisasi dependensi.
4. Pada menu atas, klik **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. Setelah selesai, klik tautan **locate** yang muncul di pojok kanan bawah untuk mengambil file `app-debug.apk` (lokasi di folder `app/build/outputs/apk/debug/app-debug.apk`).

### Metode 2: Menggunakan Terminal / Command Line
Jika komputer Anda sudah memiliki Android SDK dan Gradle:
```bash
cd android-pk-keyboard
./gradlew assembleDebug
```
File APK akan berada di `app/build/outputs/apk/debug/app-debug.apk`.

---

## 📱 Cara Penggunaan di Handphone Android

1. **Pasang File APK di HP**:
   - Kirim file `app-debug.apk` ke HP Anda (melalui WhatsApp, Telegram, atau kabel USB).
   - Buka file dan tekan **Install**.
2. **Buka Aplikasi "PK Keyboard Mobile"**:
   - Anda akan melihat antarmuka lengkap PK Matrix Vault.
   - Klik **Masuk** dan login dengan **User ID lama Anda** (misal: `budi`) dan password `1`.
   - Seluruh template yang pernah Anda buat di PC langsung muncul di layar aplikasi dan **otomatis disinkronkan ke keyboard HP**!
3. **Aktifkan Keyboard (Hanya 1 Kali di Awal)**:
   - Di bagian bawah layar akan muncul banner panduan aktivasi:
     1. Klik tombol **Aktifkan** -> Nyalakan toggle **PK Keyboard**.
     2. Pilih **PK Keyboard** sebagai keyboard aktif Anda.
4. **Mulai Layani Pelanggan di LiveChat**:
   - Buka aplikasi LiveChat (atau WhatsApp / browser Chrome).
   - Ketik pemicu: `cek/`
   - Kata `cek/` langsung terhapus dan kalimat respon lengkap otomatis tertempel di ruang obrolan!

---

## ⚡ Alternatif Tanpa Install APK (Kamus Gboard)
Jika Anda ingin langsung menggunakan pemicu di HP hari ini juga menggunakan keyboard bawaan HP:
1. Buka web **PK VAULT** di laptop/HP.
2. Klik tombol hijau **`📱 MOBILE`** di bilah atas.
3. Di tab **Kamus HP (Instan)**, klik **Unduh Kamus Android (.TXT)**.
4. Buka **Pengaturan HP Android > Bahasa & Masukan > Kamus Pribadi > Impor**.
