'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { DonationForm } from '../DonationForm';

const paymentEnabled = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === 'true';

export default function DonationPlatformPage() {
  const router = useRouter();

  useEffect(() => {
    if (!paymentEnabled) {
      router.replace('/campaign');
    }
  }, [router]);

  if (!paymentEnabled) {
    return null;
  }

  return <DonationForm donationType="PLATFORM" backHref="/donation" />;
}
