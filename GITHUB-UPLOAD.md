# Upload GuruSuite ke GitHub

## Rekomendasi Username

Pilih username yang sederhana, profesional, dan mudah diingat:

1. `dhaniekusnadi`
2. `dhanie-kusnadi`
3. `dhanieedu`
4. `gurudhanie`
5. `dhaniebuilds`

Rekomendasi utama: `dhaniekusnadi`

Alasannya:

- Cocok untuk personal brand.
- Mudah dibaca.
- Tidak terlalu terikat ke satu produk saja.
- Masih cocok kalau nanti membuat produk lain selain GuruSuite.

## Nama Repository

Gunakan:

```text
gurusuite
```

## Perintah Upload

Setelah membuat akun GitHub dan repository kosong bernama `gurusuite`, jalankan:

```bash
git remote add origin https://github.com/dhaniekusnadi/gurusuite.git
git push -u origin main
```

Jika username `dhaniekusnadi` tidak tersedia, ganti bagian URL dengan username yang kamu pilih:

```bash
git remote add origin https://github.com/USERNAME/gurusuite.git
git push -u origin main
```

## Setelah Upload

1. Buka Render.
2. Pilih **New Web Service**.
3. Hubungkan repo `gurusuite`.
4. Isi env dari `.env.example`.
5. Deploy.
