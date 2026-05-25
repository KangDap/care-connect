# CareConnect

![CI Testing](https://img.shields.io/badge/CI%20Testing-Success-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![Status](https://img.shields.io/badge/Project-PPL%201-green)

## 📌 Project Description

**CareConnect** adalah aplikasi web yang dirancang sebagai ruang aman bagi pengguna untuk mendapatkan dukungan psikologis, melakukan pelaporan kekerasan, berdiskusi dalam forum komunitas, serta melakukan donasi secara online.

Aplikasi ini dikembangkan sebagai project **Proyek Perangkat Lunak 1 (PPL 1)** dengan fokus pada kebutuhan pengguna, keamanan data, role-based access, serta integrasi fitur utama seperti konsultasi psikolog, pelaporan anonim, forum komunitas, donasi online, dashboard admin, dan AI Pattern Analysis.

CareConnect memiliki tiga role utama, yaitu:

- **User**: dapat membuat laporan, melakukan konsultasi, menggunakan forum komunitas, dan melakukan donasi.
- **Psikolog**: dapat melihat konsultasi yang ditugaskan, membalas chat konsultasi, melihat jadwal, dan memantau informasi terkait sesi konsultasi.
- **Admin**: dapat mengelola laporan, konsultasi, donasi, user, forum, jadwal psikolog, serta melihat AI Analysis.

---

## ✨ Main Features

### 1. Authentication
- Login
- Register
- Logout
- Google OAuth
- Role-based access control

### 2. User Profile Management
- Edit profile
- Update username
- Update avatar
- Update personal information

### 3. Consultation Scheduling
- User dapat mengisi form konsultasi
- Data konsultasi tersimpan ke database
- Jadwal konsultasi dapat dikelola melalui sistem

### 4. Consultation History
- User dapat melihat riwayat konsultasi
- Data ditampilkan berdasarkan akun yang sedang login

### 5. Consultation Chat
- User dan psikolog dapat berkomunikasi melalui room chat
- Mendukung anonymous mode
- Mendukung unread count
- Mendukung attachment/media
- User yang dikick tidak dapat mengirim pesan

### 6. Report Submission
- User dapat mengirim laporan kekerasan
- Mendukung opsi anonymous
- Mendukung upload evidence
- Data laporan tersimpan ke database

### 7. Report Tracking
- User dapat melihat status perkembangan laporan
- Status laporan ditampilkan dari database

### 8. Public Reports
- User dapat melihat laporan publik
- Hanya laporan yang sudah approved yang ditampilkan
- Mendukung search dan filter

### 9. Community Forum
- User dapat memilih forum berdasarkan kategori
- User dapat berdiskusi dalam forum komunitas
- Admin dapat mengelola forum dan member

### 10. Admin Dashboard
Admin dapat mengelola:

- Reports
- Consultations
- Donations
- Users
- Community Forum
- Psychologist Schedules
- AI Analysis

### 11. Online Donation
- Donasi online terintegrasi dengan Midtrans
- Mendukung status transaksi seperti pending, paid, failed, dan cancelled
- Data donasi tersimpan ke database

### 12. Donation History
- Riwayat donasi tersimpan di database
- Data dapat ditampilkan pada dashboard

### 13. Psychologist Schedule
- Admin dapat mengatur jadwal psikolog
- Psikolog dapat melihat jadwal yang tersedia

### 14. AI Insight & Impact Dashboard
- Menggunakan pendekatan **Market Basket Analysis**
- Digunakan untuk melihat pola dari data laporan
- Menampilkan frequent itemsets dan association rules

---

## 🧩 Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend
- Next.js API Route
- Prisma ORM
- PostgreSQL
- Supabase

### Authentication
- Better Auth / Auth system
- Google OAuth
- Role-based access control

### Payment Gateway
- Midtrans

### Testing
- Vitest
- Unit Testing
- Black Box Testing
- CI Testing with GitHub Actions

### Project Management
- GitHub Issues
- Trello
- Scrum Sprint

---

## 📁 Project Structure

```bash
care-connect/
├── prisma/
│   └── schema.prisma
├── public/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── dashboard/
│   │   ├── consultation/
│   │   ├── consultation-chat/
│   │   ├── donation/
│   │   ├── login/
│   │   ├── profile/
│   │   ├── publicreports/
│   │   └── report/
│   ├── components/
│   ├── lib/
│   └── styles/
├── tests/
│   ├── donation/
│   ├── chat/
│   ├── reports/
│   ├── access/
│   └── ai/
├── package.json
└── README.md