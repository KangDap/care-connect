'use client';

import { useSearchParams } from 'next/navigation';

type ConsultationItem = {
  id: number;
  title: string;
  category: string;
  date: Date;
  time: Date;
  status: string;
  psychologist: { name: string | null } | null;
};

type ConsultationsContentProps = {
  consultations: ConsultationItem[];
};

const formatDateTimeLabel = (dateValue: Date, timeValue: Date) => {
  const dateLabel = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(dateValue);

  const timeLabel = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timeValue);

  return `${dateLabel} • ${timeLabel}`;
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-[#D1B698]/20 text-[#D1B698]';
    case 'ONGOING':
      return 'bg-blue-100 text-blue-700';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-[#EBE6DE] text-[#193C1F]';
  }
};

export default function ConsultationsContent({
  consultations,
}: ConsultationsContentProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';

  const filteredData = consultations.filter(
    (item) =>
      (item.psychologist?.name ?? '').toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-[32px] font-black text-[#193C1F]">
          My Consultations
        </h2>
        <p className="text-[#8EA087] font-medium">
          {query
            ? `Showing results for \"${query}\"`
            : 'View and manage your consultation history.'}
        </p>
      </div>

      <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Doctor & Specialist</th>
              <th className="px-8 py-5">Date & Time</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-[14px] text-[#193C1F]">
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#F7F3ED] hover:bg-[#FDFCFB] transition-colors"
                >
                  <td className="px-8 py-6">
                    <p className="font-bold">
                      {row.psychologist?.name ?? 'Waiting for psychologist...'}
                    </p>
                    <p className="text-[12px] opacity-60 font-medium">
                      {row.title} • {row.category}
                    </p>
                  </td>
                  <td className="px-8 py-6 font-bold">
                    {formatDateTimeLabel(row.date, row.time)}
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black ${getStatusBadgeClass(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-[12px] font-bold text-[#8EA087] hover:text-[#193C1F] underline">
                      Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-20 text-center text-[#8EA087] font-bold"
                >
                  No consultations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
