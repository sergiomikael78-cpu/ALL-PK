/**
 * Dataset Default KEEP VAULT
 * Diadaptasi langsung dari referensi catatan Google Keep pengguna.
 */

// SVG Sample Graphics for default cards
const SAMPLE_GRAPHIC_SCATTER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="%230b0f19"/>
      <stop offset="100%" stop-color="%231a2639"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="%23f59e0b"/>
      <stop offset="100%" stop-color="%23fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="600" height="340" fill="url(%23bgGrad)"/>
  <rect x="30" y="25" width="540" height="290" rx="12" fill="%23111827" stroke="%23374151" stroke-width="2"/>
  <text x="300" y="65" fill="%23fbbf24" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">FORMULIR KLAIM EVENT SCATTER</text>
  <rect x="60" y="95" width="480" height="36" rx="6" fill="%231f2937" stroke="%234b5563"/>
  <text x="75" y="118" fill="%239ca3af" font-size="13" font-family="sans-serif">User ID: user001</text>
  <rect x="60" y="145" width="480" height="36" rx="6" fill="%231f2937" stroke="%23ef4444" stroke-width="2"/>
  <text x="75" y="168" fill="%23ffffff" font-size="13" font-family="monospace">Kode Tiket: #2096550687033985548</text>
  <circle cx="510" cy="163" r="10" fill="%23ef4444"/>
  <text x="510" y="167" fill="%23fff" font-size="11" font-weight="bold" text-anchor="middle">!</text>
  <rect x="60" y="195" width="480" height="36" rx="6" fill="%231f2937" stroke="%234b5563"/>
  <text x="75" y="218" fill="%239ca3af" font-size="13" font-family="sans-serif">Nominal Bet: Rp 50.000</text>
  <rect x="60" y="245" width="480" height="42" rx="8" fill="url(%23goldGrad)"/>
  <text x="300" y="272" fill="%23111827" font-size="15" font-family="sans-serif" font-weight="bold" text-anchor="middle">KIRIM KLAIM TIKET SEKARANG</text>
</svg>`;

const SAMPLE_GRAPHIC_QR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="400" height="400" fill="%23ffffff"/>
  <!-- Outer Finder 1 -->
  <rect x="40" y="40" width="90" height="90" fill="%231e293b" rx="8"/>
  <rect x="58" y="58" width="54" height="54" fill="%23ffffff" rx="4"/>
  <rect x="72" y="72" width="26" height="26" fill="%23ef4444" rx="3"/>
  <!-- Outer Finder 2 -->
  <rect x="270" y="40" width="90" height="90" fill="%231e293b" rx="8"/>
  <rect x="288" y="58" width="54" height="54" fill="%23ffffff" rx="4"/>
  <rect x="302" y="72" width="26" height="26" fill="%23ef4444" rx="3"/>
  <!-- Outer Finder 3 -->
  <rect x="40" y="270" width="90" height="90" fill="%231e293b" rx="8"/>
  <rect x="58" y="288" width="54" height="54" fill="%23ffffff" rx="4"/>
  <rect x="72" y="302" width="26" height="26" fill="%23ef4444" rx="3"/>
  <!-- QR Grid Pattern Elements -->
  <rect x="155" y="45" width="24" height="24" fill="%231e293b"/>
  <rect x="215" y="45" width="24" height="48" fill="%231e293b"/>
  <rect x="155" y="95" width="48" height="24" fill="%231e293b"/>
  <rect x="50" y="160" width="24" height="80" fill="%231e293b"/>
  <rect x="100" y="160" width="30" height="40" fill="%231e293b"/>
  <circle cx="200" cy="200" r="38" fill="%23ef4444"/>
  <text x="200" y="206" fill="%23fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">QRIS</text>
  <rect x="260" y="160" width="90" height="30" fill="%231e293b"/>
  <rect x="310" y="210" width="40" height="40" fill="%231e293b"/>
  <rect x="160" y="270" width="80" height="25" fill="%231e293b"/>
  <rect x="160" y="320" width="30" height="40" fill="%231e293b"/>
  <rect x="260" y="280" width="90" height="80" fill="%231e293b"/>
</svg>`;

const SAMPLE_GRAPHIC_WHEEL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 320" width="100%" height="100%">
  <defs>
    <linearGradient id="wheelBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="%230f172a"/>
      <stop offset="100%" stop-color="%231e293b"/>
    </linearGradient>
  </defs>
  <rect width="500" height="320" fill="url(%23wheelBg)"/>
  <circle cx="250" cy="160" r="120" fill="%23334155" stroke="%23fbbf24" stroke-width="6"/>
  <!-- Wheel Slices -->
  <path d="M250,160 L250,40 A120,120 0 0,1 354,100 Z" fill="%23ef4444"/>
  <path d="M250,160 L354,100 A120,120 0 0,1 370,160 Z" fill="%23f59e0b"/>
  <path d="M250,160 L370,160 A120,120 0 0,1 335,245 Z" fill="%2310b981"/>
  <path d="M250,160 L335,245 A120,120 0 0,1 250,280 Z" fill="%233b82f6"/>
  <path d="M250,160 L250,280 A120,120 0 0,1 146,220 Z" fill="%238b5cf6"/>
  <path d="M250,160 L146,220 A120,120 0 0,1 146,100 Z" fill="%23ec4899"/>
  <path d="M250,160 L146,100 A120,120 0 0,1 250,40 Z" fill="%2306b6d4"/>
  <!-- Center Pin -->
  <circle cx="250" cy="160" r="28" fill="%23ffffff" stroke="%23fbbf24" stroke-width="4"/>
  <text x="250" y="165" fill="%231e293b" font-size="12" font-weight="bold" text-anchor="middle">SPIN</text>
  <!-- Pointer Arrow -->
  <polygon points="250,28 262,50 238,50" fill="%23fbbf24"/>
</svg>`;

window.DEFAULT_KEEP_NOTES = [
  {
    id: "keep_1",
    title: "CONTOH PENGISIAN FORM SCATTER",
    content: "Berikut adalah contoh pengisian formulir claim scatter di https://latotoklaim.com ya bosku\n\nNote : - Periksa kembali seluruh data yang Anda masukkan agar tidak terjadi kesalahan sebelum mengeklik tombol \"Kirim Klaim\".\n- Pastikan data sudah sesuai agar proses pengecekan berjalan lancar dan dapat segera diproses tanpa kendala. Terima kasih.",
    category: "Event",
    color: "purple", // #3c1f5c
    isPinned: true,
    image: SAMPLE_GRAPHIC_SCATTER,
    links: ["https://latotoklaim.com"],
    createdAt: "2026-09-12T14:30:00.000Z",
    updatedAt: "2026-09-12T17:45:00.000Z",
    copyCount: 15
  },
  {
    id: "keep_2",
    title: "Bonus LUCKY WHEEL",
    responses: [
      "untuk bonus lucky wheel bisa di dapatkan jika anda memiliki tranksaksi deposit pada hari sebelum nya ya bosku",
      "untuk bonus LUCKY WHEEL secara otomatis dibagikan oleh system kami jika anda memenuhi syarat tanpa perlu anda claim kepada kami ya bosku",
      "Jangan berkecil hati ya bosku, semoga di putaran selanjutnya anda mendapatkan bonus lucky wheel nya ya bosku",
      "silahkan anda lakukan spin LUCKY WHEEL pada hari berikut nya menggunakan user id yang sama ya bosku",
      "jika anda deposit dan bermain pada hari ini, silahkan anda spin bonus LUCKY WHEEL pada ke esokan hari, jika beruntung mendapatkan bonus nya, maka bonus tersebut otomatis akan masuk ke saldo akun anda ya bosku.",
      "Mohon maaf apakah yang anda maksud bonus LUCKY WHEEL bosku ?",
      "Luckywheel Bisa di Spin setelah pukul 04:00 WIB ya bosku, silahkan ditunggu bosku",
      "Jangan berkecil hati ya bosku, semoga beruntung mendapatkan bonus LUCKY WHEEL pada hari berikutnya bosku"
    ],
    content: "untuk bonus lucky wheel bisa di dapatkan jika anda memiliki tranksaksi deposit pada hari sebelum nya ya bosku\n\nuntuk bonus LUCKY WHEEL secara otomatis dibagikan oleh system kami jika anda memenuhi syarat tanpa perlu anda claim kepada kami ya bosku\n\nJangan berkecil hati ya bosku, semoga di putaran selanjutnya anda mendapatkan bonus lucky wheel nya ya bosku\n\nsilahkan anda lakukan spin LUCKY WHEEL pada hari berikut nya menggunakan user id yang sama ya bosku\n\njika anda deposit dan bermain pada hari ini, silahkan anda spin bonus LUCKY WHEEL pada ke esokan hari, jika beruntung mendapatkan bonus nya, maka bonus tersebut otomatis akan masuk ke saldo akun anda ya bosku.\n\nMohon maaf apakah yang anda maksud bonus LUCKY WHEEL bosku ?\n\nLuckywheel Bisa di Spin setelah pukul 04:00 WIB ya bosku, silahkan ditunggu bosku\n\nJangan berkecil hati ya bosku, semoga beruntung mendapatkan bonus LUCKY WHEEL pada hari berikutnya bosku",
    category: "Promo",
    color: "amber", // #5c3000
    isPinned: true,
    image: SAMPLE_GRAPHIC_WHEEL,
    links: [],
    createdAt: "2026-09-11T10:00:00.000Z",
    updatedAt: "2026-09-13T09:12:00.000Z",
    copyCount: 42
  },
  {
    id: "keep_3",
    title: "KETERLAMBATAN PROSES SCATTER",
    content: "Yth. Member setia Kami. Kami informasikan bahwa saat ini proses bonus event scatter mahjong ways 1 & 2 sedang mengalami sedikit keterlambatan, Untuk claim bonus anda akan otomatis terproses apabila telah memenuhi syarat dan ketentuan yang berlaku pada event tersebut, Untuk estimasi waktu masih belum dapat kami pastikan, namun akan diusahakan sesegera mungkin. Mohon maaf atas ketidaknyamanan ini...",
    category: "Event",
    color: "teal", // #134e4a
    isPinned: true,
    image: null,
    links: [],
    createdAt: "2026-09-10T08:15:00.000Z",
    updatedAt: "2026-09-10T08:15:00.000Z",
    copyCount: 28
  },
  {
    id: "keep_4",
    title: "Member Komplain Situs Lemot, Game Lemot, Situs Tidak Bisa...",
    content: "Mohon maaf bosku perihal kendala Situs Lag (Lemot) silahkan anda lengkapi data di bawah ini ya bosku :\n\n- Screenshoot Kendala :\n- IP (Silahkan anda klik link tersebut kemudian kirimkan kepada kami) https://whatismyipaddress.com/ atau https://whoer.net\n- Jam saat berkendala :\n- Link saat ini digunakan :\n\nNB : Silahkan anda lengkapi data di atas agar dapat kami bantu pengecekan terkait kendala anda ya bosku",
    category: "Kendala",
    color: "charcoal", // #2d3748
    isPinned: false,
    image: null,
    links: ["https://whatismyipaddress.com/", "https://whoer.net"],
    createdAt: "2026-09-09T11:20:00.000Z",
    updatedAt: "2026-09-09T11:20:00.000Z",
    copyCount: 35
  },
  {
    id: "keep_5",
    title: "BARCODE ABA SMJ",
    content: "harap informasikan \"Done\" jika sudah mengirimkan dana ya bosku, Terimakasih",
    category: "Deposit",
    color: "wine", // #5c1d2e
    isPinned: false,
    image: SAMPLE_GRAPHIC_QR,
    links: [],
    createdAt: "2026-09-08T15:40:00.000Z",
    updatedAt: "2026-09-08T15:40:00.000Z",
    copyCount: 19
  },
  {
    id: "keep_6",
    title: "PIALA DUNIA",
    content: "Syarat & Ketentuan Event\n1. Periode Event\nPeriode pengumpulan poin berlangsung mulai tanggal 11 Juni 2026 hingga 19 Juli 2026 dan mencakup seluruh pertandingan resmi Piala Dunia 2026.\n\n2. Pemenang Event\nSebanyak 8.000 peserta dengan total poin tertinggi pada akhir periode event berhak mendapatkan hadiah sesuai dengan tabel distribusi hadiah yang telah ditetapkan.\n\n3. Detail Sistem Perolehan Poin...",
    category: "Event",
    color: "blue", // #1a3b5c
    isPinned: false,
    image: null,
    links: [],
    createdAt: "2026-09-07T09:00:00.000Z",
    updatedAt: "2026-09-07T09:00:00.000Z",
    copyCount: 8
  },
  {
    id: "keep_7",
    title: "EVENT SCATTER MAHJONG WAYS 1 & 2 LATOTO",
    content: "EVENT SCATTER MAHJONG WAYS 1 & 2 LATOTO\nSyarat dan Ketentuan :\nEvent hanya berlaku pada permainan Slot PG SOFT : Mahjong Ways 1 & Mahjong Ways 2\nHadiah :\nBet : 1.600 - 2.000\n3 scatter : 15.000,-\n4 scatter : 30.000,-\n5 scatter : 75.000,-\n\nBet : 4.000 - 8.000\n3 scatter : 35.000,-\n4 scatter : 70.000,-",
    category: "Event",
    color: "green", // #1b4332
    isPinned: false,
    image: null,
    links: ["https://latotoklaim.com"],
    createdAt: "2026-09-06T14:10:00.000Z",
    updatedAt: "2026-09-06T14:10:00.000Z",
    copyCount: 51
  },
  {
    id: "keep_8",
    title: "KODE PEMULIHAN DASHBOARD SCATTER",
    content: "TPKRH-YC6KT\nEV4Z9-5TX3B\nX2LCR-HU93Z\n3NK9Y-BWHWD\nE4AL7-T579Z\nNCPRG-67Z2K\nGHBHR-824JH\nEAEKH-CSX9G\nNM8LP-5BTHC\n7EM5R-48YWA",
    category: "SOP",
    color: "wine", // #5c1d2e
    isPinned: false,
    image: null,
    links: [],
    createdAt: "2026-09-05T12:00:00.000Z",
    updatedAt: "2026-09-05T12:00:00.000Z",
    copyCount: 12
  },
  {
    id: "keep_9",
    title: "VOUCHER SABA",
    content: "Respon jika ada member yang tidak bisa melakukan betingan mengunakan voucher promo provider saba sport\n\nRespon 1:\nUntuk saat ini promo dari pihak provider tersebut sudah tidak dapat di gunakan ya bosku dan tidak ikut serta dalam promo terkait, oleh karena itu hadiah tersebut sudah tidak tersedia pada kami ya bosku, Terima kasih",
    category: "Promo",
    color: "blue", // #1a3b5c
    isPinned: false,
    image: null,
    links: [],
    createdAt: "2026-09-04T16:00:00.000Z",
    updatedAt: "2026-09-04T16:00:00.000Z",
    copyCount: 16
  },
  {
    id: "keep_10",
    title: "AKUN IP BANNED",
    content: "Mohon dibantu klik link yang kami berikan gunakan melakukan pengecekan lebih lanjut terkait kendala anda ya bosku.\nSilahkan klik link berikut : https://whoer.net\n\nJika sudah melakukan klik pada link yang kami berikan, silahkan anda screenshoot tampilan tersebut dan berikan pada kami ya bosku.\n\nBaik bosku, untuk kendala akun anda, silahkan melakukan login pada akun...",
    category: "Kendala",
    color: "purple", // #3c1f5c
    isPinned: false,
    image: null,
    links: ["https://whoer.net"],
    createdAt: "2026-09-03T07:22:00.000Z",
    updatedAt: "2026-09-03T07:22:00.000Z",
    copyCount: 22
  },
  {
    id: "keep_11",
    title: "KALKULATOR TOGEL",
    content: "Jika anda memiliki pertanyaan hadiah yang anda dapatkan jika menang pada permainan togel, saat ini kami telah memiliki kalkulator hadiah otomatis ya bosku.\n\nPRIZE 3 / 3 PRIZE\nKONSEP DASAR PERMAINAN 3 PRIZE\nDalam sistem 3 Prize, satu nomor taruhan (contoh: 4D) memiliki 3 peluang menang sekaligus...",
    category: "SOP",
    color: "blue", // #1a3b5c
    isPinned: false,
    image: null,
    links: [],
    createdAt: "2026-09-02T13:40:00.000Z",
    updatedAt: "2026-09-02T13:40:00.000Z",
    copyCount: 14
  },
  {
    id: "keep_12",
    title: "CARA MENGAKTIFKAN SERVER MILOBOT-AI",
    content: "# Tutorial: Menjalankan Server & Mengaktifkan Analisis Reflektif (Silent Learning) MiloBot-Ai\n\nIkuti panduan langkah demi langkah di bawah ini untuk menghidupkan mesin kecerdasan buatan MiloBot-Ai di komputer Anda.\n---\n## 1. Persiapan Mesin AI (Ollama)\nSebelum server node dinyalakan, Anda wajib memastikan otak AI (Ollama) sudah aktif dan memiliki ketiga model yang dibutuhkan.\n1. Buka CMD / Terminal\n2. Jalankan perintah: ollama serve",
    category: "Tutorial",
    color: "charcoal", // #2d3748
    isPinned: false,
    image: null,
    links: [],
    createdAt: "2026-09-01T09:10:00.000Z",
    updatedAt: "2026-09-01T09:10:00.000Z",
    copyCount: 9
  }
];
