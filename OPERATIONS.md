# Operasional Harian GuruSuite

## Menerima Pembayaran

1. Pengguna membuat invoice dari halaman utama.
2. Pengguna transfer ke BSI 7567057270 a.n. Dhanie Kusnadi sesuai nominal unik.
3. Pengguna klik konfirmasi Email.
4. Admin cek mutasi rekening.
5. Admin buka `/admin.html`.
6. Admin masukkan PIN.
7. Admin klik **Refresh Order**.
8. Admin klik **Tandai Lunas**.
9. Sistem membuat kode aktivasi.
10. Admin klik **Kirim Email** atau salin kode aktivasi.

## Backup Order

1. Buka `/admin.html`.
2. Masukkan PIN admin.
3. Klik **Refresh Order**.
4. Klik **Export JSON**.
5. Simpan file backup di Google Drive/flashdisk/cloud storage.

## Restore Order

1. Buka `/admin.html`.
2. Masukkan PIN admin.
3. Pilih file backup pada **Restore Backup JSON**.
4. Konfirmasi restore.
5. Klik **Refresh Order**.

## Sebelum Update Aplikasi

```bash
npm test
```

Jika test lulus, lanjut deploy. Jika test gagal, jangan deploy dulu.

## Kalau Server Restart

Jika `DATA_DIR` memakai persistent disk, order tetap aman. Jika tidak memakai persistent disk, order bisa hilang saat hosting melakukan redeploy.

## Upgrade Berikutnya

- Sambungkan Midtrans/Xendit/Tripay webhook.
- Pindahkan order dari JSON ke PostgreSQL/Supabase.
- Tambahkan login server-side untuk pengguna.
- Tambahkan export `.docx` native.
