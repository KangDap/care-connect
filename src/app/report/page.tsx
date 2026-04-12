'use client';

import { Alert } from '@/components/alert';
import ReportForm from '@/components/form';
// Import tipe data dari form.tsx
import { ReportSubmitData } from '@/components/form';
import { Header } from '@/components/header';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AnonymousReportPage() {
  const router = useRouter();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    description: '',
    type: 'primary' as 'danger' | 'warning' | 'primary',
    onConfirm: () => {},
  });

  // SEKARANG SUDAH MATCH:
  const handleFinalSubmit = (data: ReportSubmitData) => {
    console.log('Submitting:', data);
    router.push('/dashboard');
  };

  // ... (sisa kode navigation & return sama, jangan diubah)

  const confirmNavigation = (targetPath: string, mode: 'nav' | 'logout') => {
    setAlertConfig({
      title: mode === 'logout' ? 'Logout?' : 'Leave Page?',
      description:
        mode === 'logout'
          ? 'Are you sure you want to end your session? Your progress will not be saved.'
          : 'Your report progress will be lost if you navigate away. Continue?',
      type: mode === 'logout' ? 'danger' : 'warning',
      onConfirm: () => {
        setIsAlertOpen(false);
        router.push(targetPath);
      },
    });
    setIsAlertOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F3ED] flex flex-col font-sans">
      <div className="sticky top-0 z-[100] w-full bg-[#F7F3ED]/80 backdrop-blur-md border-b border-[#D0D5CB]/30">
        <Header
          withSearch={false}
          withLogo={true}
          onProfileClick={() => confirmNavigation('/profile', 'nav')}
          onLogoutClick={() => confirmNavigation('/login', 'logout')}
        />
      </div>

      <main className="max-w-[1200px] mx-auto w-full py-16 px-6 flex-1">
        <div className="max-w-4xl mx-auto">
          <ReportForm
            formTitle="Violence Report Form"
            formSubtitle="Fill in the details below. Your safety and privacy are our top priority."
            onSubmit={handleFinalSubmit}
          />
        </div>
      </main>

      <Alert
        isOpen={isAlertOpen}
        title={alertConfig.title}
        description={alertConfig.description}
        type={alertConfig.type}
        confirmText="Yes, Continue"
        cancelText="Go Back"
        onClose={() => setIsAlertOpen(false)}
        onConfirm={alertConfig.onConfirm}
      />
    </div>
  );
}
