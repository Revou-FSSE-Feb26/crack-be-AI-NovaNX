# NexRead API — Panduan Pengujian Staging

Panduan ini mencakup seluruh endpoint yang terdaftar di controller aplikasi. Jalankan hanya pada database staging, bukan production. Semua data uji memakai awalan `qa-{{runId}}` supaya mudah dikenali dan dibersihkan.

## 1. Prasyarat

- URL HTTPS staging, tanpa trailing slash, misalnya `https://<service-staging>.up.railway.app`.
- Akun admin staging yang berasal dari `ADMIN_SEED_EMAIL` dan `ADMIN_SEED_PASSWORD`.
- Node.js dan dependency proyek sudah terpasang (`npm ci`).
- Database staging sudah dimigrasi dan memiliki sedikitnya satu akun admin aktif.
- Jangan menyimpan password admin atau token di collection, repository, screenshot, maupun laporan.

Swagger tersedia di `{{baseUrl}}/api`. Header untuk endpoint terlindungi:

```http
Authorization: Bearer {{userAccessToken}}
Content-Type: application/json
X-Request-Id: qa-{{runId}}-<nama-test>
```

Respons error normal berbentuk JSON dengan status yang sesuai. Catat juga header `x-request-id`; nilai ini dipakai untuk mencari request yang gagal di log staging.

## 2. Variabel dan data uji

Buat environment Postman `NexRead - Staging` dengan variabel berikut. Tandai token dan password sebagai **secret/sensitive** jika versi Postman mendukungnya.

| Variabel | Nilai awal/contoh |
| --- | --- |
| `baseUrl` | URL staging tanpa `/` di akhir |
| `runId` | timestamp unik, contoh `20260904-153000` |
| `adminEmail` | email admin staging |
| `adminPassword` | password admin staging |
| `adminUserId`, `adminAccessToken`, `adminRefreshToken` | kosong; diisi dari login |
| `userEmail` | `qa-user-{{runId}}@example.com` |
| `userPassword` | `StagePass!123` |
| `userNewPassword` | `StagePass!456` |
| `userId`, `userAccessToken`, `userRefreshToken` | kosong; diisi dari register/login |
| `otherEmail` | `qa-other-{{runId}}@example.com` |
| `otherPassword` | `StagePass!123` |
| `otherUserId`, `otherAccessToken`, `otherRefreshToken` | kosong; diisi dari register |
| `targetEmail` | `qa-target-{{runId}}@example.com` |
| `targetUserId` | kosong |
| `authorId` | `qa-author-{{runId}}` |
| `categoryId` | `qa-category-{{runId}}` |
| `bookId` | `qa-book-{{runId}}` |
| `authorId2` | `qa-author2-{{runId}}` |
| `categoryId2` | `qa-category2-{{runId}}` |
| `bookId2` | `qa-book2-{{runId}}` |
| `cartItemId`, `loanId`, `adminLoanId`, `reviewId` | kosong; diisi dari respons |
| `futureDueAt` | ISO timestamp dinamis, 14 hari dari waktu tes |

Payload utama (setiap blok adalah body request terpisah):

Register user utama:

```json
{"fullName":"QA Staging User","email":"{{userEmail}}","password":"{{userPassword}}"}
```

Register user kedua:

```json
{"fullName":"QA Other User","email":"{{otherEmail}}","password":"{{otherPassword}}"}
```

Register target administrasi:

```json
{"fullName":"QA Admin Target","email":"{{targetEmail}}","password":"{{otherPassword}}"}
```

Author:

```json
{"id":"{{authorId}}","name":"QA Author {{runId}}","rating":4.2,"avatarPath":"/qa/author.svg"}
```

Category:

```json
{"id":"{{categoryId}}","name":"QA Category {{runId}}","slug":"qa-category-{{runId}}","subtitle":"Staging only","iconPath":"/qa/category.svg"}
```

Book (`totalCopies=1` memudahkan pengujian stok habis):

```json
{"id":"{{bookId}}","title":"QA Book {{runId}}","authorId":"{{authorId}}","categoryId":"{{categoryId}}","totalCopies":1,"coverClassName":"qa-cover"}
```

Review:

```json
{"rating":5,"comment":"Review otomatis staging {{runId}}"}
```

Di tab **Tests** Postman, simpan nilai dinamis dengan pola berikut setelah request yang relevan:

```javascript
const body = pm.response.json();
pm.environment.set('userAccessToken', body.accessToken);
pm.environment.set('userRefreshToken', body.refreshToken);
pm.environment.set('userId', body.user.id);
```

Untuk due date yang selalu valid, jalankan ini sekali pada tab **Pre-request Script** request admin loan:

```javascript
pm.environment.set(
  'futureDueAt',
  new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
);
```

Untuk resource biasa, simpan `body.id` ke variabel yang sesuai. Jangan pernah menulis nilai token aktual ke laporan pengujian.

## 3. Urutan eksekusi dan expected result

Urutan penting karena cart, loan, review, inventory, dan penghapusan catalog saling bergantung.

### A. Preflight dan endpoint publik

| No. | Request | Data | Expected |
| ---: | --- | --- | --- |
| 1 | `GET /` | — | `200`, body `Hello World!` |
| 2 | `GET /health/live` | — | `200`, `status: "ok"` |
| 3 | `GET /health/ready` | — | `200`, `status: "ok"`; membuktikan DB siap |
| 4 | `GET /authors?search=QA&page=1&limit=10` | — | `200`, objek `data` dan `meta`; `q` tetap didukung sebagai alias lama |
| 5 | `GET /authors/popular?page=1&limit=5` | — | `200`, data terurut menurut popularity |
| 6 | `GET /categories` | — | `200`, array |
| 7 | `GET /books?page=1&limit=10&sortBy=title&order=asc` | — | `200`, objek `data` dan `meta` |
| 8 | `GET /books/recommend?page=1&limit=5` | — | `200`, data rekomendasi terpaginasikan |

Tes negatif query: ulangi endpoint pagination dengan `page=0`, `limit=101`, `available=abc`, atau enum sort/status yang tidak sah; expected `400`.

### B. Authentication

| No. | Request | Body/auth | Expected dan penyimpanan |
| ---: | --- | --- | --- |
| 9 | `POST /auth/register` | payload user utama | `201`; simpan token pair dan `userId` |
| 10 | `POST /auth/register` | payload user kedua | `201`; simpan `otherAccessToken`, refresh token, dan `otherUserId` |
| 11 | `POST /auth/register` | payload target admin | `201`; simpan `targetUserId` |
| 12 | `POST /auth/login` | `{"email":"{{adminEmail}}","password":"{{adminPassword}}"}` | `200`; simpan admin token pair |
| 13 | `POST /auth/login` | password user salah | `401` |
| 14 | `POST /auth/register` | email user utama yang sama | `409` |
| 15 | `POST /auth/register` | email invalid/password < 8/missing field, satu kasus per request | masing-masing `400` |
| 16 | `POST /auth/refresh` | `{"refreshToken":"{{userRefreshToken}}"}` | `200`; simpan token pair baru dan simpan refresh lama sebagai `oldUserRefreshToken` |
| 17 | `POST /auth/refresh` | refresh lama | `401` karena token bersifat single-use/rotating |

Kontrol RBAC yang harus diulang pada sedikitnya satu endpoint admin: tanpa bearer → `401`; bearer user biasa → `403`; bearer admin → sukses.

### C. Profil user dan admin user management

| No. | Request | Body/auth | Expected |
| ---: | --- | --- | --- |
| 18 | `GET /me` | user | `200`; tidak ada field password/hash; ada `loanStatistics` |
| 19 | `PATCH /me` | `{"fullName":"QA Staging User Updated"}` / user | `200`; nama berubah |
| 20 | `GET /users?q={{targetEmail}}&page=1&limit=5` | admin | `200`; target ditemukan |
| 21 | `GET /users/{{targetUserId}}` | admin | `200`; data target, tanpa password/hash |
| 22 | `PATCH /users/{{targetUserId}}/role` | `{"role":"ADMIN"}` / admin | `200`, role `ADMIN` |
| 23 | endpoint admin apa saja | token target lama | `401`; role/token version lama telah invalid |
| 24 | `PATCH /users/{{targetUserId}}/role` | `{"role":"USER"}` / admin | `200`, role kembali `USER` |
| 25 | `PATCH /users/{{adminUserId}}/role` | `{"role":"USER"}` / admin | `409`; admin tidak boleh demote diri sendiri |

Ambil `adminUserId` dari respons login admin. Jangan mencoba menghapus admin utama staging.

### D. CRUD catalog

Semua mutasi memakai bearer admin.

| No. | Request | Body | Expected |
| ---: | --- | --- | --- |
| 26 | `POST /authors` | `{"name":"QA Author {{runId}}"}` (`id` opsional) | `201`; simpan `id` respons sebagai `authorId` untuk `POST /books` |
| 27 | `GET /authors/{{authorId}}` | — | `200` |
| 28 | `PATCH /authors/{{authorId}}` | `{"name":"QA Author Updated {{runId}}","rating":4.4}` | `200`; perubahan tersimpan |
| 29 | `POST /categories` | payload category | `201` |
| 30 | `GET /categories/{{categoryId}}` | — | `200` |
| 31 | `PATCH /categories/{{categoryId}}` | `{"subtitle":"Updated on staging"}` | `200` |
| 32 | `POST /books` | payload book (JSON atau multipart, optional file `cover`) | `201`; `totalCopies=1`, `availableCopies=1` |
| 33 | `GET /books/{{bookId}}` | — | `200`; author/category nested benar |
| 34 | `GET /authors/{{authorId}}/books?page=1&limit=5` | — | `200`; book uji ada di `data` |
| 35 | `GET /books?title=QA&authorId={{authorId}}&categoryId={{categoryId}}&minRating=0&available=true&sortBy=createdAt&order=desc&page=1&limit=10` | — | `200`; filter dan pagination benar |
| 36 | `PATCH /books/{{bookId}}` | `{"title":"QA Book Updated {{runId}}"}` | `200`; judul berubah |
| 37 | `DELETE /authors/{{authorId}}` | — | `409`; masih direferensikan book |
| 38 | `DELETE /categories/{{categoryId}}` | — | `409`; masih direferensikan book |

Tes negatif tambahan: POST author/category/book yang sama → `409`; POST book dengan `authorId`/`categoryId` tidak ada → `400`; GET/PATCH id tidak ada → `404`; mutasi catalog memakai token user → `403`.

### E. Cart dan checkout

Gunakan bearer user utama.

| No. | Request | Body | Expected |
| ---: | --- | --- | --- |
| 39 | `GET /api/cart` | — | `200`, awalnya array kosong |
| 40 | `POST /api/cart/items` | `{"bookId":"{{bookId}}"}` | `201`; simpan `cartItemId` |
| 41 | request add yang sama | sama | `409` |
| 42 | `GET /api/cart` | — | `200`; item dan nested book benar |
| 43 | `GET /api/cart/checkout` | — | `200`; `user`, `items`, `totalItems: 1` |
| 44 | `DELETE /api/cart/items/{{cartItemId}}` | — | `204`, body kosong |
| 45 | add kembali, lalu `DELETE /api/cart` | payload add | add `201`, clear `204` |
| 46 | add kembali, lalu `POST /loans/from-cart` | `{"durationDays":5}` | `201`; array berisi satu loan, simpan `loanId`; cart menjadi kosong |
| 47 | `POST /loans/from-cart` saat cart kosong | `{"durationDays":5}` | `400` |

Ulangi checkout dengan `durationDays: 4`; expected `400` karena hanya `3`, `5`, atau `10` yang sah.

### F. Loans

| No. | Request | Body/auth | Expected |
| ---: | --- | --- | --- |
| 48 | `GET /loans?status=ACTIVE&page=1&limit=10` | user | `200`; loan checkout ada |
| 49 | `POST /loans` | `{"bookId":"{{bookId}}"}` / user kedua | `409`; satu-satunya copy sedang dipinjam |
| 50 | `DELETE /books/{{bookId}}` | admin | `409`; masih ada active loan |
| 51 | `PATCH /loans/{{loanId}}/return` | user kedua | `403`; loan milik user utama |
| 52 | `PATCH /loans/{{loanId}}/return` | user utama | `200`; status `RETURNED`, `returnedAt` terisi |
| 53 | request return yang sama | user utama | `409` |
| 54 | `POST /admin/loans` | `{"userId":{{otherUserId}},"bookId":"{{bookId}}","dueAt":"{{futureDueAt}}"}` / admin | `201`; simpan `adminLoanId` |
| 55 | `GET /admin/loans?status=ACTIVE&q=QA&page=1&limit=10` | admin | `200`; loan admin ada dan memiliki nested user/book |
| 56 | `PATCH /admin/loans/{{adminLoanId}}` | buat `futureDueAt` baru (mis. now + 21 hari), lalu `{"dueAt":"{{futureDueAt}}"}` / admin | `200`; due date berubah |
| 57 | `PATCH /admin/loans/{{adminLoanId}}` | `{"status":"RETURNED"}` / admin | `200`; status returned |
| 58 | `GET /admin/loans/overdue?page=1&limit=10` | admin | `200`; hanya loan aktif dengan `dueAt < now` |

API memang menolak due date lampau dan due date lebih dari 365 hari (`409`). Untuk membuktikan endpoint overdue dengan hasil non-kosong, siapkan loan overdue melalui seed/fixture khusus staging, verifikasi muncul di `/overdue`, lalu return melalui endpoint admin. Tanpa fixture, endpoint tetap dapat diverifikasi untuk status/schema `200` dan aturan bahwa semua item yang dikembalikan (jika ada) berstatus aktif dengan `dueAt < now`.

### G. Reviews

Book tetap boleh direview setelah loan dikembalikan.

| No. | Request | Body/auth | Expected |
| ---: | --- | --- | --- |
| 59 | `POST /books/{{bookId}}/reviews` | payload review / user utama | `201`; simpan `reviewId` |
| 60 | request review yang sama | user utama | `409`; satu review per user/book |
| 61 | `GET /books/{{bookId}}/reviews` | publik | `200`; review dan user ringkas ada |
| 62 | `PATCH /reviews/{{reviewId}}` | `{"rating":4,"comment":"Updated {{runId}}"}` / user utama | `200` |
| 63 | `PATCH /reviews/{{reviewId}}` | `{"rating":1}` / user kedua | `403` |
| 64 | `GET /me/reviews?page=1&limit=5` | user utama | `200`; review dan nested book ada |
| 65 | `GET /books/{{bookId}}` | publik | `200`; `reviewCount`, `reviews`, dan derived rating berubah |
| 66 | `DELETE /reviews/{{reviewId}}` | user utama | `200`; review yang dihapus dikembalikan |
| 67 | `GET /books/{{bookId}}/reviews` | publik | `200`; review tadi tidak ada dan rating direkalkulasi |

Validasi negatif: rating `0`/`6` atau comment lebih dari 1000 karakter → `400`; id review tidak ada → `404`.

### H. Analytics admin

| No. | Request | Auth | Expected |
| ---: | --- | --- | --- |
| 68 | `GET /admin/dashboard` | admin | `200`; metrik numerik dan daftar top books valid |
| 69 | `GET /admin/authors/statistics` | admin | `200`; array statistik author |
| 70 | `GET /admin/categories/statistics` | admin | `200`; termasuk kategori dengan nol book |

Untuk ketiganya: tanpa token → `401`, token user → `403`.

### I. Password, logout, delete user, dan cleanup

Jalankan tahap ini paling akhir karena token akan dicabut dan akun dihapus.

| No. | Request | Body/auth | Expected |
| ---: | --- | --- | --- |
| 71 | `PATCH /me/password` | `{"currentPassword":"{{userPassword}}","newPassword":"{{userNewPassword}}"}` / user utama | `204`; body kosong |
| 72 | `POST /auth/login` | password lama | `401` |
| 73 | `POST /auth/login` | password baru | `200`; simpan token pair baru |
| 74 | `POST /auth/logout` | bearer user utama | `204`; discard token pair di client |
| 75 | `POST /auth/refresh` | refresh dari langkah 73 | `401`; sudah dicabut logout |
| 76 | login lagi, lalu `DELETE /me` | user utama | login `200`, delete `204` |
| 77 | `POST /auth/login` | kredensial user utama | `401`; akun soft-deleted |
| 78 | `DELETE /users/{{targetUserId}}` | admin | `204` |
| 79 | `GET /users/{{targetUserId}}` | admin | `404` |
| 80 | `DELETE /users/{{adminUserId}}` | admin | `409`; self-delete admin dilarang |
| 81 | `DELETE /books/{{bookId}}` | admin | `200` setelah semua loan returned |
| 82 | `GET /books/{{bookId}}` | publik | `404` |
| 83 | `DELETE /authors/{{authorId}}` | admin | `200` |
| 84 | `DELETE /categories/{{categoryId}}` | admin | `409` bila book di langkah 81 diarsipkan karena memiliki riwayat loan/review; soft-deleted book masih mereferensikan category |
| 85 | `DELETE /me` | login sebagai user kedua | `204` |
| 86 | `POST /auth/logout` | admin | `204`; refresh admin dicabut |

Jika `bookId2`/author/category kedua dibuat untuk skenario overdue, return seluruh loan lalu hapus melalui API dengan urutan book → author → category. Book yang memiliki riwayat akan menjadi soft-deleted; category terkait tetap tidak dapat dihapus melalui API karena relasi historis masih ada. Bersihkan fixture tersebut langsung dari database hanya pada staging disposable dan hanya dengan target ID `qa-{{runId}}`. Jangan menghapus seeded catalog.

## 4. Menjalankan collection yang tersedia

Collection existing bersifat self-cleaning dan cocok untuk smoke serta regresi utama. Dari direktori `nexread-api`:

```bash
npm ci

# preflight singkat; tidak membutuhkan kredensial admin
NEWMAN_BASE_URL="https://<staging-host>" npm run test:newman:smoke

# regression; kredensial hanya berada di environment shell lokal
ADMIN_SEED_EMAIL="<admin-staging-email>" \
ADMIN_SEED_PASSWORD="<admin-staging-password>" \
NEWMAN_BASE_URL="https://<staging-host>" \
npm run test:newman:regression
```

Laporan dibuat di:

- `test-report/newman-reports/newman-smoke-report.html`
- `test-report/newman-reports/newman-regression-report.html`
- `test-report/newman-reports/newman-regression-report.json`

Collection saat ini belum mengirim request untuk seluruh variasi endpoint berikut, sehingga langkah manual di atas tetap wajib untuk klaim cakupan 100% route:

- `GET/PATCH /me`, `PATCH /me/password`;
- `GET /users/:id`, `PATCH /users/:id/role`, `DELETE /users/:id`;
- `POST /admin/loans`, `PATCH /admin/loans/:id`;
- pengujian ownership/RBAC lintas user pada review dan return loan.

## 5. Kriteria lulus

Satu endpoint dinyatakan lulus bila:

1. status code sesuai tabel;
2. schema dan tipe field sesuai Swagger;
3. tidak ada password, refresh-token hash, atau data sensitif dalam respons;
4. perubahan state terbukti lewat GET berikutnya;
5. aturan ownership/RBAC menghasilkan `401` atau `403` yang tepat;
6. constraint menghasilkan `400`/`404`/`409`, bukan raw `500`;
7. `x-request-id` selalu tersedia;
8. response time dicatat (gunakan target tim; bila belum ada SLA, tandai baseline p50/p95 dari run ini);
9. tidak ada sisa data `qa-{{runId}}` setelah cleanup, kecuali record historis yang memang dipertahankan oleh kebijakan soft delete; fixture ini dibersihkan lewat prosedur database staging yang terkontrol.

Format pencatatan defect minimum: waktu WIB, environment/revision, method/path, sanitized request, expected, actual, status code, `x-request-id`, langkah reproduksi, severity, dan screenshot/response tanpa token.

## 6. Catatan operasional

- Jalankan smoke dahulu. Hentikan regresi bila `/health/ready` gagal.
- Hindari tes rate limit bersamaan dengan suite utama. Default auth limit adalah 10 register/menit, 10 login/menit, dan 20 refresh/menit per IP; expected ketika terlampaui adalah `429`.
- Refresh token berotasi. Selalu ganti **kedua** token setelah refresh berhasil.
- Login baru membatalkan refresh session sebelumnya untuk user yang sama.
- Logout mencabut refresh token; access token yang sudah diterbitkan dapat tetap hidup sampai expiry, jadi client harus membuang keduanya.
- Perubahan password/role dan soft delete menginvalidasi akses sesuai state user terbaru.
- Endpoint cart memakai prefix `/api/cart`, sedangkan endpoint lain tidak memakai global `/api`; `/api` sendiri adalah Swagger UI.

### Add Book dengan cover lokal

Alur pemilihan author pada form Add Book:

1. Cari berdasarkan nama melalui `GET /authors?search=<nama>&page=1&limit=10`.
2. Jika author ditemukan, gunakan nilai `data[].id` sebagai `authorId`.
3. Jika belum ditemukan, buat melalui `POST /authors` dengan body minimal
   `{"name":"Nama Author"}`. Field `id` boleh tetap dikirim untuk kompatibilitas,
   tetapi bila dihilangkan API membuat ID slug yang unik.
4. Gunakan `id` dari respons `POST /authors` sebagai `authorId` ketika memanggil
   `POST /books`.

Setelah versi yang mendukung upload Add Book dideploy, gunakan `POST /books`
dengan bearer token admin dan body `multipart/form-data`:

- Text: `id`, `title`, `authorId`, `categoryId` (wajib).
- Text opsional: `description`, `pageCount`, `totalCopies`, `rating`, `coverUrl`, `coverClassName`.
- File opsional: `cover` (JPG/JPEG, PNG, WEBP; maksimal 5 MB).

Biarkan client/Postman mengatur header Content-Type beserta boundary. File
`cover` diprioritaskan jika `coverUrl` juga dikirim. Respons `201` berisi
`coverUrl` berupa path `/covers/books/...`, relatif terhadap origin API.
JSON dengan `coverUrl` tetap didukung.

Periksa: file valid menghasilkan `201`; format tidak didukung menghasilkan
`400`; file melebihi 5 MB menghasilkan `413`; nilai angka tidak valid
menghasilkan `400`; user non-admin menghasilkan `403`.
Pada UI Add Book, pilih Browse image, periksa preview, lalu Save. File baru
diunggah bersamaan dengan data buku saat Save.
