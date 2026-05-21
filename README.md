# GuruSuite MVP

Generator perangkat ajar guru untuk jenjang SD, SMP, dan SMA/SMK dengan pilihan kurikulum, semester, mapel, topik, dan paket dokumen.

## Cara pakai

Cara termudah:

```powershell
node server.js
```

Lalu buka `http://127.0.0.1:4175`.

Atau buka `index.html` langsung di browser, isi parameter ajar, lalu klik **Generate Perangkat**.

Fitur awal:

- Pilihan jenjang, kelas, mapel, kurikulum, dan semester.
- Identitas sekolah, tahun ajaran, fase/kompetensi, CP/KD/TP custom, karakteristik siswa, dan konteks lokal.
- Paket generate: Lengkap, Fokus Mengajar, Administrasi, dan Asesmen.
- Generate Modul Ajar, Silabus, ATP, Program Tahunan, RPP Ringkas, Bahan Ajar, LKPD, Asesmen, Rubrik, Program Semester, Kisi-kisi Soal, Remedial/Pengayaan, dan Jurnal Mengajar.
- Preview dokumen.
- Salin teks.
- Cetak.
- Export `.doc` yang bisa dibuka di Microsoft Word.
- Riwayat generate tersimpan di browser.
- Akun lokal sederhana untuk menyimpan nama dan kontak pengguna.
- Kuota gratis 3 generate.
- Paket harga Pro Guru dan Sekolah.
- Instruksi pembayaran manual via transfer/QRIS/email admin.
- Invoice pembayaran dengan nominal unik.
- Konfirmasi email otomatis berisi detail order.
- Panel admin untuk menandai order lunas.
- Kode aktivasi otomatis setelah order lunas.
- Endpoint webhook `/api/payment-webhook` untuk disambungkan ke payment gateway asli nanti.
- Proteksi panel admin memakai `ADMIN_PIN`.
- Halaman admin pembayaran terpisah di `/admin.html`.
- Siap deploy sebagai Node.js web service lewat Render/Railway/VPS/Docker.
- Contoh PM2 dan Nginx tersedia untuk VPS.

## Model monetisasi awal

- Gratis: 3 generate/bulan.
- Pro Guru: Rp79.000/bulan.
- Paket sekolah: Rp299.000-Rp999.000/bulan.
- Jasa setup sekolah/guru: Rp300.000-Rp2.000.000 tergantung jumlah mapel dan format dokumen.

## Catatan produk

Ini MVP awal. Untuk dijual secara serius, langkah berikutnya adalah menambah database CP/KD resmi per mapel, login pengguna berbasis server, payment gateway asli, dan export `.docx`/PDF native.

Bagian pembayaran saat ini memakai mode transfer manual yang bisa diotomasi dari panel admin. Rekening manual yang dipakai: BSI 7567057270 a.n. Dhanie Kusnadi, konfirmasi via email admin. QRIS bisa ditambahkan nanti setelah merchant siap.

Email admin default: `dhaniekusnadi73@guru.sd.belajar.id`.

Panduan deploy ada di `DEPLOYMENT.md`. Untuk publik, wajib set `ADMIN_PIN` ke PIN yang kuat.

Sebelum share link ke pengguna, ikuti `PRODUCTION-CHECKLIST.md`.

Panduan operasional harian ada di `OPERATIONS.md`, dan ringkasan status siap deploy ada di `DEPLOY-READY.md`.

Panduan upload ke GitHub ada di `GITHUB-UPLOAD.md`.
