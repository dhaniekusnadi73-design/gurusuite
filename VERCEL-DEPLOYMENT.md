# Deploy GuruSuite ke Vercel

Vercel tidak menyimpan file server secara permanen. Untuk produksi, GuruSuite memakai:

- Vercel: hosting static + serverless API.
- Supabase: database order pembayaran dan lisensi.

## 1. Buat Database Supabase

1. Buka Supabase.
2. Buat project baru.
3. Buka SQL Editor.
4. Jalankan isi file `supabase-schema.sql`.

## 2. Ambil Supabase Env

Dari Supabase Project Settings:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Gunakan **service role key** hanya di environment Vercel, jangan taruh di frontend.

## 3. Import GitHub Repo ke Vercel

1. Buka Vercel.
2. Add New Project.
3. Pilih repo `dhaniekusnadi73-design/gurusuite`.
4. Framework Preset: Other.
5. Build Command: `npm run check`.
6. Output Directory: kosongkan atau `.`.

## 4. Isi Environment Variables di Vercel

```env
ADMIN_PIN=buat-pin-admin-yang-kuat
WEBHOOK_SECRET=buat-secret-webhook
PUBLIC_BASE_URL=https://domain-vercel-kamu.vercel.app

PAYMENT_BANK=BSI
PAYMENT_ACCOUNT_NUMBER=7567057270
PAYMENT_ACCOUNT_NAME=Dhanie Kusnadi
PAYMENT_QRIS_LABEL=Siapkan QRIS merchant kamu di sini
ADMIN_EMAIL=dhaniekusnadi73@guru.sd.belajar.id

PRICE_PRO_GURU=79000
PRICE_SEKOLAH=299000

SUPABASE_URL=https://project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key-dari-supabase
```

## 5. Deploy

Klik Deploy. Setelah selesai, cek:

- `/`
- `/admin.html`
- `/api/health`

`/api/health` harus menampilkan:

```json
{
  "ok": true,
  "storage": "supabase"
}
```

Kalau `storage` masih `file`, berarti env Supabase belum masuk.
