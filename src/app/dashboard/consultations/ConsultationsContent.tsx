'use client';

import { RECENT_CONSULTATIONS } from '@/constants';
import { useSearchParams } from 'next/navigation';

export default function ConsultationsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';

  const filteredData = RECENT_CONSULTATIONS.filter(
    (item) =>
      item.dr.toLowerCase().includes(query) ||
      item.spec.toLowerCase().includes(query),
  );

  return (
    <div className="p-12 space-y-8 animate-fade-in">
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
                    <p className="font-bold">{row.dr}</p>
                    <p className="text-[12px] opacity-60 font-medium">
                      {row.spec}
                    </p>
                  </td>
                  <td className="px-8 py-6 font-bold">{row.date}</td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black ${
                        row.status === 'UPCOMING'
                          ? 'bg-[#D1B698]/20 text-[#D1B698]'
                          : 'bg-[#EBE6DE]'
                      }`}
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
