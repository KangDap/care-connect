'use client';

import { Alert } from '@/components/alert';
import ReportForm from '@/components/form';
import { ReportSubmitData } from '@/components/form';
import { PublicHeader } from '@/components/public-header';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AnonymousReportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    description: '',
    type: 'primary' as 'danger' | 'warning' | 'primary',
    onConfirm: () => {},
  });

  const mapCategoryToApiValue = (value: string) => {
    const normalized = value.trim().toUpperCase();
    switch (normalized) {
      case 'PHYSICAL':
      case 'SEXUAL':
      case 'PSYCHOLOGICAL':
      case 'OTHER':
        return normalized;
      default:
        return 'OTHER';
    }
  };

  const handleFinalSubmit = async (data: ReportSubmitData) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('category', mapCategoryToApiValue(data.type));
      formData.append('incidentDate', data.date);
      formData.append('province', data.province);
      formData.append('city', data.city);
      formData.append('district', data.district);
      formData.append('address', data.fullAddress || '');
      formData.append('description', data.description);
      formData.append('isAnonymous', data.isAnonymous ? 'on' : '');

      for (const file of data.files) {
        formData.append('evidence', file);
      }

      const response = await fetch('/api/report', {
        method: 'POST',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        const message =
          payload?.error?.message ||
          payload?.error ||
          'Failed to submit report';
        throw new Error(message);
      }

      setAlertConfig({
        title: 'Report Submitted',
        description:
          'Your report has been submitted successfully and is now being reviewed.',
        type: 'primary',
        onConfirm: () => {
          setIsAlertOpen(false);
          router.push('/dashboard');
        },
      });
      setIsAlertOpen(true);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to submit report. Please try again.';

      setAlertConfig({
        title: 'Submission Failed',
        description: message,
        type: 'danger',
        onConfirm: () => setIsAlertOpen(false),
      });
      setIsAlertOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // const confirmNavigation = (targetPath: string, mode: 'nav' | 'logout') => {
  //   setAlertConfig({
  //     title: mode === 'logout' ? 'Logout?' : 'Leave Page?',
  //     description:
  //       mode === 'logout'
  //         ? 'Are you sure you want to end your session? Your progress will not be saved.'
  //         : 'Your report progress will be lost if you navigate away. Continue?',
  //     type: mode === 'logout' ? 'danger' : 'warning',
  //     onConfirm: () => {
  //       setIsAlertOpen(false);
  //       router.push(targetPath);
  //     },
  //   });
  //   setIsAlertOpen(true);
  // };

  return (
    <div className="min-h-screen bg-[#F7F3ED] flex flex-col font-sans">
      <div className="sticky top-0 z-[100] w-full bg-[#F7F3ED]/80 backdrop-blur-md border-b border-[#D0D5CB]/30">
        <PublicHeader />
      </div>

      <main className="max-w-[1200px] mx-auto w-full py-16 px-6 flex-1">
        <div className="max-w-4xl mx-auto">
          <ReportForm
            formTitle="Violence Report Form"
            formSubtitle="Fill in the details below. Your safety and privacy are our top priority."
            onSubmit={handleFinalSubmit}
          />
          {isSubmitting ? (
            <p className="mt-4 text-center text-sm font-semibold text-[#8EA087]">
              Submitting your report...
            </p>
          ) : null}
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
