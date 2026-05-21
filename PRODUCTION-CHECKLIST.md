# Checklist Sebelum Share Link GuruSuite

Gunakan checklist ini sebelum website dibagikan ke guru/sekolah.

## Wajib

- `ADMIN_PIN` sudah diganti dari default.
- `PUBLIC_BASE_URL` sudah sesuai domain publik.
- `DATA_DIR` memakai persistent disk atau folder server yang tidak hilang saat restart.
- Rekening pembayaran benar: BSI 7567057270 a.n. Dhanie Kusnadi.
- Email admin benar.
- Coba buat invoice dari paket Pro Guru.
- Coba klik konfirmasi Email dan pastikan pesan order terbentuk.
- Coba buka `/admin.html`.
- Coba tandai order lunas dari halaman admin.
- Coba masukkan kode aktivasi di akun pengguna.
- Refresh halaman pengguna dan pastikan paket aktif tetap tervalidasi.
- Coba export JSON order dari halaman admin.
- Simpan file backup order di tempat aman.
- Jalankan `npm test` sebelum deploy ulang.
- Pastikan `/privacy.html` dan `/terms.html` bisa dibuka.
- Pastikan GitHub Actions lulus setelah push ke GitHub.

## Disarankan

- Pakai domain sendiri.
- Aktifkan HTTPS.
- Simpan backup `orders.json` berkala.
- Siapkan template balasan email untuk pengguna setelah pembayaran.
- Tambahkan QRIS merchant setelah tersedia.

## Setelah Ada Pembeli

1. Pengguna membuat invoice.
2. Pengguna transfer sesuai nominal unik.
3. Pengguna klik konfirmasi Email.
4. Admin cek mutasi rekening.
5. Admin buka panel Admin Pembayaran.
6. Admin masukkan PIN.
7. Admin klik Refresh Order.
8. Admin klik Tandai Lunas.
9. Sistem membuat kode aktivasi.
10. Admin kirim kode aktivasi ke pengguna.
