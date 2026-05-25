# CareConnect

![CI Status](https://img.shields.io/badge/CI%20Testing-Passed-brightgreen)
![Build](https://img.shields.io/badge/Build-Success-brightgreen)
![Unit Test](https://img.shields.io/badge/Unit%20Testing-Vitest-blue)
![Framework](https://img.shields.io/badge/Framework-Next.js-black)
![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)

---

## Deskripsi Project

**CareConnect** adalah aplikasi web yang dirancang untuk mendukung layanan kesehatan mental, pelaporan kasus, forum komunitas, dan donasi online dalam satu platform terintegrasi.

Aplikasi ini dikembangkan untuk membantu pengguna mendapatkan akses bantuan psikologis secara lebih mudah, membuat laporan terkait kasus kekerasan atau permasalahan personal, berdiskusi dalam komunitas yang aman, serta memberikan dukungan melalui fitur donasi.

CareConnect memiliki tiga role utama, yaitu **User**, **Psychologist**, dan **Admin**. Setiap role memiliki akses dan kebutuhan yang berbeda sesuai dengan alur penggunaan aplikasi.

---

## Tujuan Project

CareConnect dikembangkan dengan tujuan untuk:

1. Menyediakan platform konsultasi psikologis secara online.
2. Memudahkan pengguna dalam membuat dan melacak laporan kasus.
3. Menyediakan forum komunitas yang aman untuk berbagi cerita dan dukungan.
4. Memfasilitasi donasi untuk mendukung korban atau pengembangan platform.
5. Membantu admin dan psikolog mengelola data melalui dashboard.
6. Mengintegrasikan fitur analisis berbasis AI untuk membantu admin memahami pola laporan.

---

## Fitur Utama

### 1. Authentication

Fitur autentikasi digunakan untuk mengelola akses pengguna ke dalam aplikasi.

Fitur yang tersedia:

- Register menggunakan email dan password
- Login menggunakan email dan password
- Login menggunakan Google SSO
- Logout
- Reset password
- Email verification
- Session management
- Role-based access control

Role pengguna:

- `USER`
- `PSYCHOLOGIST`
- `ADMIN`

---

### 2. Profile Management

Pengguna dapat mengelola profil pribadi melalui halaman profile.

Data yang dapat dikelola:

- Username
- Bio
- Nomor telepon
- Gender
- Tanggal lahir
- Foto profil
- Password

Fitur ini membantu pengguna memperbarui informasi akun sesuai kebutuhan.

---

### 3. Consultation

Fitur konsultasi memungkinkan pengguna membuat jadwal konsultasi dengan psikolog.

Fitur yang tersedia:

- Melihat slot jadwal konsultasi
- Memilih tanggal dan waktu konsultasi
- Membuat konsultasi baru
- Upload dokumen pendukung
- Mode anonim
- Penjadwalan otomatis dengan psikolog yang tersedia
- Riwayat konsultasi
- Dashboard konsultasi

Sistem akan mengecek ketersediaan jadwal psikolog sebelum konsultasi dibuat.

---

### 4. Consultation Chat

Setelah konsultasi dibuat, pengguna dan psikolog dapat berkomunikasi melalui ruang chat konsultasi.

Fitur yang tersedia:

- Mengirim pesan teks
- Mengirim file atau media
- Reply pesan
- Mode anonim
- Riwayat chat
- Validasi akses hanya untuk peserta konsultasi
- Room chat memiliki batas waktu aktif

---

### 5. Report / Pelaporan Kasus

Pengguna dapat membuat laporan terkait kejadian atau kasus tertentu.

Kategori laporan:

- `PHYSICAL`
- `SEXUAL`
- `PSYCHOLOGICAL`
- `OTHER`

Fitur laporan:

- Membuat laporan baru
- Mengisi judul, kategori, lokasi, tanggal, dan deskripsi kejadian
- Upload evidence atau bukti pendukung
- Mode anonim
- Tracking status laporan
- Public report
- Search dan filter laporan
- Admin dapat mengelola status laporan

---

### 6. Community Chat

CareConnect menyediakan forum komunitas sebagai ruang aman untuk pengguna saling berbagi dan mendukung.

Fitur komunitas:

- Melihat daftar channel
- Join channel
- Leave channel
- Mengirim pesan
- Mengirim media
- Mode anonim
- Unread count
- System message untuk aktivitas penting
- Moderasi user
- Kick atau ban user
- Change role member

Role dalam komunitas:

- `OWNER`
- `MODERATOR`
- `MEMBER`
- `BANNED`

---

### 7. Donation

CareConnect memiliki fitur donasi online yang terintegrasi dengan Midtrans.

Jenis donasi:

- Donasi untuk laporan tertentu
- Donasi untuk platform

Fitur donasi:

- Membuat donasi
- Memilih metode pembayaran
- Mendapatkan Snap Token dari Midtrans
- Melihat riwayat donasi
- Update status pembayaran melalui webhook Midtrans

Metode pembayaran:

- `BANK_TRANSFER`
- `CREDIT_CARD`
- `EWALLET`
- `QRIS`

---

### 8. Dashboard

CareConnect menyediakan dashboard berdasarkan role pengguna.

#### User Dashboard

Digunakan oleh pengguna umum untuk melihat:

- Riwayat konsultasi
- Tracking laporan
- Riwayat donasi
- Akses ke fitur utama pengguna

#### Psychologist Dashboard

Digunakan oleh psikolog untuk mengelola:

- Jadwal konsultasi
- Konsultasi yang ditugaskan
- Chat dengan user
- Riwayat konsultasi

#### Admin Dashboard

Digunakan oleh admin untuk mengelola:

- Data user
- Data laporan
- Data konsultasi
- Data donasi
- Jadwal psikolog
- Community chat
- Moderasi user
- Statistik aplikasi
- AI analysis

---

### 9. AI Analysis

CareConnect memiliki fitur AI Analysis yang membantu admin menganalisis data laporan.

Fitur AI Analysis:

- Analisis seluruh laporan
- Analisis laporan tertentu
- Mengirim data laporan ke endpoint AI
- Menggunakan kolom teks seperti `title` dan `description`
- Menampilkan hasil analisis untuk membantu insight admin

Fitur ini digunakan sebagai alat bantu analisis, bukan sebagai pengganti keputusan manusia.

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js API Route
- Prisma ORM
- Better Auth

### Database

- PostgreSQL

### Storage

- Supabase Storage

### Payment Gateway

- Midtrans

### Testing & CI

- Vitest
- V8 Coverage
- GitHub Actions
- ESLint
- Prettier

---

## Struktur Folder

```bash
care-connect/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── dashboard/
│   │   ├── consultation/
│   │   ├── consultation-chat/
│   │   ├── donation/
│   │   ├── profile/
│   │   ├── publicreports/
│   │   └── report/
│   │
│   ├── components/
│   │
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── email/
│   │   ├── api-response.ts
│   │   ├── error.ts
│   │   ├── prisma.ts
│   │   └── supabase.ts
│   │
│   ├── modules/
│   │   ├── community-chat/
│   │   ├── consultation/
│   │   ├── consultation-chat/
│   │   ├── donation/
│   │   └── report/
│   │
│   └── generated/
│
├── prisma/
│   └── schema.prisma
│
├── tests/
│   ├── lib/
│   ├── modules/
│   └── routes/
│
├── .github/
│   └── workflows/
│
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```
--
## Continuous Integration Status

CareConnect telah menerapkan **Continuous Integration (CI)** menggunakan GitHub Actions. Setiap perubahan kode yang di-push ke branch `main` atau `dev` akan secara otomatis menjalankan proses validasi project, meliputi:

- Install dependencies
- Generate Prisma Client
- Linting
- Prettier format checking
- Unit testing
- Build checking

Status CI saat ini: **Success**
