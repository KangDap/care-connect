import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

// Import komponen konten yang sudah kita buat kodenya tadi
import PsychologistConsultationsContent from './PsychologistConsultationsContent';

export default async function AllConsultationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // 1. Proteksi: Wajib Login
  if (!session?.user) {
    redirect('/login');
  }

  // 2. Ambil data profil untuk memastikan Role
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== 'PSYCHOLOGIST') {
    redirect('/dashboard/user');
  }

  // 3. Ambil SEMUA data konsultasi untuk Psikolog ini
  const allConsultations = await prisma.consultation.findMany({
    where: {
      psychologistId: session.user.id,
    },
    orderBy: {
      // Kita urutkan berdasarkan ID terbaru agar yang baru masuk ada di atas
      id: 'desc',
    },
    select: {
      id: true,
      title: true,
      category: true,
      description: true,
      date: true,
      time: true,
      status: true,
      isAnonymous: true,
      attachmentUrl: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  // 4. Kita kirim datanya ke Client Component
  return (
    <React.Suspense
      fallback={
        <div className="p-12 text-[#8EA087] animate-pulse">
          Loading all consultations...
        </div>
      }
    >
      <PsychologistConsultationsContent consultations={allConsultations} />
    </React.Suspense>
  );
}
