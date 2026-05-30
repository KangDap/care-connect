'use client';

import { DonationForm } from '../DonationForm';

export default function DonationPlatformPage() {
  return <DonationForm donationType="PLATFORM" backHref="/donation" />;
}
