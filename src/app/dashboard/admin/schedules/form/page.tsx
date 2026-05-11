import { Suspense } from 'react';

import AdminScheduleContent from '../AdminScheduleContent';

export const metadata = {
  title: 'Manage Schedule | Admin Dashboard',
  description: 'Set available consultation days and time slots.',
};

export default function ManageSchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-[#8EA087] font-semibold animate-pulse">
          Loading form...
        </div>
      }
    >
      <AdminScheduleContent />
    </Suspense>
  );
}
