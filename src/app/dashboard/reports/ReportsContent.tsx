'use client';

import { useSearchParams } from 'next/navigation';

type ReportItem = {
  id: number;
  title: string;
  status: string;
  createdAt: Date;
};

type ReportsContentProps = {
  reports: ReportItem[];
};

const formatDateLabel = (value: Date) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);

const getStatusLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-[#D1B698]/30 text-[#D1B698]';
    case 'REVIEWED':
      return 'bg-blue-100 text-blue-700';
    case 'RESOLVED':
      return 'bg-green-100 text-green-700';
    case 'REJECTED':
      return 'bg-red-100 text-red-600';
    default:
      return 'bg-[#EBE6DE] text-[#193C1F]';
  }
};

export default function ReportsContent({ reports }: ReportsContentProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';

  const filteredData = reports.filter(
    (item) =>
      String(item.id).toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-[32px] font-black text-[#193C1F]">My Reports</h2>
        <p className="text-[#8EA087] font-medium">
          {query
            ? `Showing results for \"${query}\"`
            : 'Track the status of your submitted reports.'}
        </p>
      </div>

      <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Report ID</th>
              <th className="px-8 py-5">Type</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Status</th>
            </tr>
          </thead>
          <tbody className="text-[14px] text-[#193C1F]">
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#F7F3ED] hover:bg-[#FDFCFB] transition-colors"
                >
                  <td className="px-8 py-6 font-bold">
                    #REP-{String(row.id).padStart(4, '0')}
                  </td>
                  <td className="px-8 py-6 font-medium opacity-80">
                    {row.title}
                  </td>
                  <td className="px-8 py-6 opacity-60">
                    {formatDateLabel(row.createdAt)}
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black ${getStatusBadgeClass(row.status)}`}
                    >
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-20 text-center text-[#8EA087] font-bold"
                >
                  No reports found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
