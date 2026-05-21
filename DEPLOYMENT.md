# Deploy GuruSuite ke Publik

GuruSuite sekarang bisa dijalankan sebagai aplikasi Node.js tanpa dependency eksternal.

## Opsi paling mudah: Render

1. Upload project ini ke GitHub.
2. Buka Render, pilih **New Web Service**.
3. Hubungkan repository GuruSuite.
4. Isi:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Tambahkan environment variables:
   - `HOST=0.0.0.0`
   - `PUBLIC_BASE_URL=https://domain-render-kamu.onrender.com`
   - `DATA_DIR=/var/data`
   - `ADMIN_PIN=buat-pin-yang-kuat`
   - `WEBHOOK_SECRET=buat-secret-yang-kuat`
   - `PAYMENT_BANK=BSI`
   - `PAYMENT_ACCOUNT_NUMBER=7567057270`
   - `PAYMENT_ACCOUNT_NAME=Dhanie Kusnadi`
   - `ADMIN_EMAIL=dhaniekusnadi73@guru.sd.belajar.id`
   - `PRICE_PRO_GURU=79000`
   - `PRICE_SEKOLAH=299000`
6. Tambahkan persistent disk:
   - Mount path: `/var/data`
   - Size: 1 GB cukup untuk MVP.
7. Deploy.

## Opsi VPS

```powershell
npm install
npm start
```

Untuk produksi VPS, jalankan dengan process manager seperti PM2 dan pasang reverse proxy Nginx + HTTPS.

Contoh PM2:

```bash
npm install
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Contoh Nginx tersedia di `nginx-gurusuite.conf`. Setelah domain diarahkan ke VPS, aktifkan HTTPS dengan Certbot.

## Catatan penting data order

Saat ini order disimpan di `orders.json` pada folder `DATA_DIR`. Ini cukup untuk MVP dan VPS kecil. Untuk traffic serius, pindahkan order ke database seperti PostgreSQL/Supabase.

## Keamanan produksi minimum

- Ganti `ADMIN_PIN` dengan PIN panjang yang tidak mudah ditebak.
- Jangan upload file `.env` ke GitHub.
- Jangan gunakan PIN contoh `123456`.
- Harga paket dikunci di server melalui `PRICE_PRO_GURU` dan `PRICE_SEKOLAH`, bukan dari browser.
- Endpoint admin membutuhkan PIN; endpoint webhook bisa dikunci dengan `WEBHOOK_SECRET`.

## Endpoint

- `GET /api/health` untuk cek server hidup.
- `GET /api/config` untuk konfigurasi pembayaran publik.
- `POST /api/create-order` untuk membuat invoice.
- `GET /api/orders?adminPin=...` untuk admin melihat order.
- `GET /api/orders-export?adminPin=...` untuk backup order JSON.
- `POST /api/mark-paid` untuk admin menandai lunas.
- `POST /api/activate-code` untuk aktivasi pengguna.
- `POST /api/validate-license` untuk validasi paket aktif.
- `POST /api/payment-webhook` untuk payment gateway nanti.

## Siap untuk banyak pengguna

Versi ini sudah memakai nominal unik, rate limit dasar, validasi lisensi, dan penulisan order berurutan agar file order tidak mudah korup saat beberapa request masuk bersamaan. Untuk penggunaan lebih besar, pindahkan penyimpanan order dari JSON ke PostgreSQL/Supabase.

## Tes sebelum deploy

Jalankan:

```bash
npm test
```

Tes ini membuat server sementara, membuat invoice, menandai order lunas, aktivasi lisensi, validasi lisensi, export order, dan restore backup.

## GitHub Actions

Workflow CI tersedia di `.github/workflows/ci.yml`. Setelah project diupload ke GitHub, setiap push dan pull request akan menjalankan:

- `npm run check`
- `npm test`

## URL penting

- `/` halaman generator untuk pengguna.
- `/admin.html` halaman admin pembayaran.
