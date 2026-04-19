'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

type DonationItem = {
  id: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  timestamp: Date;
  report: {
    title: string;
  };
};

type DonationsContentProps = {
  donations: DonationItem[];
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

const formatDateLabel = (value: Date) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);

const formatPaymentMethod = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const getPaymentNotice = (payment: string | null, orderId: string | null) => {
  if (!payment) {
    return null;
  }

  const orderLabel = orderId ? ` (Order: ${orderId})` : '';

  if (payment === 'success') {
    return {
      containerClass: 'border border-green-200 bg-green-50 text-green-800',
      title: 'Payment Success',
      description: `Your donation payment was completed successfully${orderLabel}.`,
    };
  }

  if (payment === 'pending') {
    return {
      containerClass: 'border border-amber-200 bg-amber-50 text-amber-800',
      title: 'Payment Pending',
      description: `Your payment is still pending confirmation${orderLabel}. Please complete the payment if needed.`,
    };
  }

  if (payment === 'error') {
    return {
      containerClass: 'border border-red-200 bg-red-50 text-red-700',
      title: 'Payment Failed',
      description: `We could not complete your payment${orderLabel}. Please try again.`,
    };
  }

  return null;
};

export default function DonationsContent({ donations }: DonationsContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';
  const payment = searchParams.get('payment');
  const orderId = searchParams.get('orderId');
  const paymentNotice = getPaymentNotice(payment, orderId);

  useEffect(() => {
    if (!payment && !orderId) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('payment');
    nextParams.delete('orderId');

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    // Replace URL so status notification does not reappear on page refresh.
    const timeout = setTimeout(() => {
      router.replace(nextUrl);
    }, 2500);

    return () => {
      clearTimeout(timeout);
    };
  }, [orderId, pathname, payment, router, searchParams]);

  const filteredData = donations.filter(
    (item) =>
      item.report.title.toLowerCase().includes(query) ||
      item.paymentMethod.toLowerCase().includes(query) ||
      item.paymentStatus.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {paymentNotice && (
        <div
          className={`rounded-2xl px-5 py-4 ${paymentNotice.containerClass}`}
        >
          <p className="text-sm font-black uppercase tracking-wide">
            {paymentNotice.title}
          </p>
          <p className="text-sm mt-1">{paymentNotice.description}</p>
        </div>
      )}

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
              filteredData.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[#F7F3ED] hover:bg-[#FDFCFB] transition-colors"
                >
                  <td className="px-8 py-6 font-bold">{row.report.title}</td>
                  <td className="px-8 py-6 opacity-60">
                    {formatDateLabel(row.timestamp)}
                  </td>
                  <td className="px-8 py-6 font-medium italic text-[#8EA087]">
                    {formatPaymentMethod(row.paymentMethod)}
                  </td>
                  <td className="px-8 py-6 text-right font-black text-[16px]">
                    {formatRupiah(row.amount)}
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
