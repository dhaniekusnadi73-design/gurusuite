# GuruSuite Deploy Ready

Status: siap deploy MVP publik.

## Sudah Ada

- Generator perangkat ajar SD/SMP/SMA.
- Paket dokumen lengkap.
- Export `.doc`.
- Akun lokal pengguna.
- Kuota gratis.
- Invoice pembayaran dengan nominal unik.
- Rekening BSI dan email admin.
- Kode aktivasi.
- Validasi lisensi server-side.
- Halaman admin terpisah.
- Export dan restore backup order.
- Rate limit dasar.
- Persistent disk support.
- Render, Docker, PM2, dan Nginx config.
- Smoke test otomatis.
- Halaman privasi dan syarat layanan.
- Robots dan sitemap dasar.

## Batasan MVP

- Order masih memakai JSON file, bukan database.
- Deteksi transfer masih manual dari admin.
- QRIS belum diisi.
- Belum ada login server-side.
- Export Word masih `.doc` berbasis HTML, belum `.docx` native.

## Rekomendasi Deploy Pertama

Gunakan Render atau VPS kecil. Set environment variable dari `.env.example`, terutama:

- `ADMIN_PIN`
- `DATA_DIR`
- `PUBLIC_BASE_URL`
- `WEBHOOK_SECRET`

Setelah online, buka `/admin.html`, buat 1 order percobaan, tandai lunas, lalu aktivasi kode.
