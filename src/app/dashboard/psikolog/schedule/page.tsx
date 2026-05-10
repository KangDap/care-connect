import { Suspense } from 'react';

import PsychologistScheduleView from './PsychologistScheduleView';

export const metadata = {
  title: 'My Schedule | Psychologist Dashboard',
  description: 'View your configured consultation availability schedule.',
};

export default function PsychologistSchedulePage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-[#8ea087] font-semibold animate-pulse">
          Loading schedule...
        </div>
      }
    >
      <PsychologistScheduleView />
    </Suspense>
  );
}
