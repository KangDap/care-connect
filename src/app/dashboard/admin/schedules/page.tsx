import { Suspense } from 'react';

import AdminScheduleContent from './AdminScheduleContent';

export const metadata = {
  title: 'Psychologist Schedules | Admin Dashboard',
  description:
    'Manage consultation availability schedules for each psychologist.',
};

export default function AdminSchedulesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-[#8EA087] font-semibold animate-pulse">
          Loading schedules...
        </div>
      }
    >
      <AdminScheduleContent />
    </Suspense>
  );
}
