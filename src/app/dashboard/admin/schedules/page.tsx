import { Suspense } from 'react';

import HistoryClient from './HistoryClient';

export const metadata = {
  title: 'Psychologist Schedules | Admin Dashboard',
  description:
    'Manage consultation availability schedules for each psychologist.',
};

export default function AdminSchedulesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-[#8ea087] font-semibold animate-pulse">
          Loading schedules...
        </div>
      }
    >
      <HistoryClient />
    </Suspense>
  );
}
