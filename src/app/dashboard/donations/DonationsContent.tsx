'use client';

import { DONATION_HISTORY } from '@/constants';
import { useSearchParams } from 'next/navigation';

export default function DonationsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';

  const filteredData = DONATION_HISTORY.filter(
    (item) =>
      item.name.toLowerCase().includes(query) ||
      item.via.toLowerCase().includes(query),
  );

  return (
    <div className="p-12 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[32px] font-black text-[#193C1F]">
            Donation History
          </h2>
          <p className="text-[#8EA087] font-medium">
            {query
              ? `Showing results for \"${query}\"`
              : 'Your contributions to the community.'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Source / Donor</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Via</th>
              <th className="px-8 py-5 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="text-[14px] text-[#193C1F]">
            {filteredData.length > 0 ? (
              filteredData.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[#F7F3ED] hover:bg-[#FDFCFB] transition-colors"
                >
                  <td className="px-8 py-6 font-bold">{row.name}</td>
                  <td className="px-8 py-6 opacity-60">{row.date}</td>
                  <td className="px-8 py-6 font-medium italic text-[#8EA087]">
                    {row.via}
                  </td>
                  <td className="px-8 py-6 text-right font-black text-[16px]">
                    {row.amount}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-20 text-center text-[#8EA087] font-bold"
                >
                  No donations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
