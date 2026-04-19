'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type DonationItem = {
  id: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  timestamp: string;
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

const formatDateLabel = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

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

const mapTransactionStatusToNotice = (transactionStatus: string | null) => {
  if (!transactionStatus) {
    return null;
  }

  const normalized = transactionStatus.toLowerCase();

  if (normalized === 'pending') {
    return 'pending';
  }

  if (normalized === 'settlement' || normalized === 'capture') {
    return 'success';
  }

  if (
    normalized === 'deny' ||
    normalized === 'cancel' ||
    normalized === 'expire' ||
    normalized === 'failure'
  ) {
    return 'error';
  }

  return null;
};

const mapDonationStatusToNotice = (status: string | undefined) => {
  if (!status) {
    return null;
  }

  const normalized = status.toUpperCase();

  if (normalized === 'PAID') {
    return 'success';
  }

  if (normalized === 'PENDING') {
    return 'pending';
  }

  if (
    normalized === 'FAILED' ||
    normalized === 'EXPIRED' ||
    normalized === 'CANCELLED'
  ) {
    return 'error';
  }

  return null;
};

export default function DonationsContent({ donations }: DonationsContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.get('search')?.toLowerCase() || '';
  const payment = searchParams.get('payment');
  const orderId = searchParams.get('orderId') || searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');
  const initialNotice = useMemo(
    () =>
      mapTransactionStatusToNotice(transactionStatus) ||
      (payment === 'success' || payment === 'pending' || payment === 'error'
        ? payment
        : null),
    [payment, transactionStatus],
  );
  const [resolvedPayment, setResolvedPayment] = useState<string | null>(
    initialNotice,
  );
  const paymentNotice = getPaymentNotice(resolvedPayment, orderId);

  useEffect(() => {
    setResolvedPayment(initialNotice);
  }, [initialNotice]);

  useEffect(() => {
    if (!payment && !orderId && !transactionStatus) {
      return;
    }

    const shouldSyncStatus = !!orderId;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('payment');
    nextParams.delete('orderId');
    nextParams.delete('order_id');
    nextParams.delete('transaction_status');
    nextParams.delete('status_code');

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const wait = (ms: number) =>
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      });

    const runSync = async () => {
      if (shouldSyncStatus) {
        const maxAttempts = payment === 'success' ? 6 : 3;

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          if (cancelled) {
            return;
          }

          try {
            const res = await fetch('/api/donation/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ orderId }),
            });

            if (res.ok) {
              const payload = await res.json().catch(() => ({}));
              const currentStatus = payload?.data?.paymentStatus as
                | string
                | undefined;

              const syncedNotice = mapDonationStatusToNotice(currentStatus);
              if (syncedNotice) {
                setResolvedPayment(syncedNotice);
              }

              router.refresh();

              if (currentStatus && currentStatus !== 'PENDING') {
                break;
              }
            }
          } catch (error) {
            console.error('Failed to sync donation status:', error);
          }

          if (attempt < maxAttempts - 1) {
            await wait(1500);
          }
        }
      }

      if (cancelled) {
        return;
      }

      // Replace URL so status notification does not reappear on page refresh.
      timeout = setTimeout(() => {
        router.replace(nextUrl);
      }, 2500);
    };

    void runSync();

    return () => {
      cancelled = true;
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [orderId, pathname, payment, router, searchParams, transactionStatus]);

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
