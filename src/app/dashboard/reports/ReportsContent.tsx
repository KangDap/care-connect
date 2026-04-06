'use client';

import { REPORT_STATUS } from '@/constants';
import { useSearchParams } from 'next/navigation';

export default function ReportsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';

  const filteredData = REPORT_STATUS.filter(
    (item) =>
      item.id.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query),
  );

  return (
    <div className="p-12 space-y-8 animate-fade-in">
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
                  <td className="px-8 py-6 font-bold">{row.id}</td>
                  <td className="px-8 py-6 font-medium opacity-80">
                    {row.type}
                  </td>
                  <td className="px-8 py-6 opacity-60">{row.date}</td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black ${
                        row.status === 'PENDING REVIEW'
                          ? 'bg-[#D1B698]/30 text-[#D1B698]'
                          : row.status === 'REJECTED'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-[#EBE6DE]'
                      }`}
                    >
                      {row.status}
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
