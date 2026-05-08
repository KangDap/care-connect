'use client';

import { Pagination } from '@/components/pagination';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type MidtransSnapCallback = {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
};

type MidtransSnapWindow = Window & {
  snap?: {
    pay: (token: string, callbacks?: MidtransSnapCallback) => void;
  };
};

type DonationItem = {
  id: number;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  timestamp: string;
  reportId: number | null;
  midtransOrderId: string | null;
  snapToken: string | null;
  report: {
    title: string;
    description: string;
  } | null;
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

/** Simplify to 3 display statuses */
const getDisplayStatus = (status: string): 'PENDING' | 'PAID' | 'CANCELED' => {
  const s = status.toUpperCase();
  if (s === 'PAID') return 'PAID';
  if (s === 'PENDING') return 'PENDING';
  return 'CANCELED';
};

const STATUS_BADGE: Record<
  'PENDING' | 'PAID' | 'CANCELED',
  { label: string; cls: string }
> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
  PAID: { label: 'Paid', cls: 'bg-green-100 text-green-700' },
  CANCELED: { label: 'Canceled / Failed', cls: 'bg-red-100 text-red-600' },
};

type PaymentNoticeState =
  | 'success'
  | 'pending'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'error';

const getPaymentNotice = (
  payment: PaymentNoticeState | null,
  orderId: string | null,
) => {
  if (!payment) return null;
  const orderLabel = orderId ? ` (Order: ${orderId})` : '';
  const notices: Record<
    PaymentNoticeState,
    { containerClass: string; title: string; description: string }
  > = {
    success: {
      containerClass: 'border border-green-200 bg-green-50 text-green-800',
      title: 'Payment Success',
      description: `Donation payment completed successfully${orderLabel}.`,
    },
    pending: {
      containerClass: 'border border-amber-200 bg-amber-50 text-amber-800',
      title: 'Payment Pending',
      description: `Your payment is pending${orderLabel}. Complete it from Donation History.`,
    },
    failed: {
      containerClass: 'border border-red-200 bg-red-50 text-red-700',
      title: 'Payment Failed',
      description: `Payment could not be completed${orderLabel}. Please try again.`,
    },
    expired: {
      containerClass: 'border border-red-200 bg-red-50 text-red-700',
      title: 'Payment Expired',
      description: `Payment expired${orderLabel}. Please create a new donation.`,
    },
    cancelled: {
      containerClass: 'border border-red-200 bg-red-50 text-red-700',
      title: 'Payment Cancelled',
      description: `Payment was cancelled${orderLabel}. You can donate again anytime.`,
    },
    error: {
      containerClass: 'border border-red-200 bg-red-50 text-red-700',
      title: 'Payment Error',
      description: `An unexpected error occurred${orderLabel}. Please try again.`,
    },
  };
  return notices[payment] ?? null;
};

const mapTransactionStatusToNotice = (
  s: string | null,
): PaymentNoticeState | null => {
  if (!s) return null;
  const n = s.toLowerCase();
  if (n === 'pending') return 'pending';
  if (n === 'settlement' || n === 'capture') return 'success';
  if (n === 'cancel') return 'cancelled';
  if (n === 'expire') return 'expired';
  if (n === 'deny' || n === 'failure') return 'failed';
  return null;
};

const mapDonationStatusToNotice = (
  s: string | undefined,
): PaymentNoticeState | null => {
  if (!s) return null;
  const n = s.toUpperCase();
  if (n === 'PAID') return 'success';
  if (n === 'PENDING') return 'pending';
  if (n === 'FAILED') return 'failed';
  if (n === 'EXPIRED') return 'expired';
  if (n === 'CANCELLED') return 'cancelled';
  return null;
};

const SNAP_URL_SANDBOX = 'https://app.sandbox.midtrans.com/snap/snap.js';
const SNAP_URL_PROD = 'https://app.midtrans.com/snap/snap.js';

const loadSnapAndPay = (
  token: string,
  clientKey: string | undefined,
  callbacks: MidtransSnapCallback,
) => {
  const isSandbox = clientKey?.startsWith('SB-') ?? true;
  const SNAP_URL = isSandbox ? SNAP_URL_SANDBOX : SNAP_URL_PROD;

  const existing = document.querySelector(
    `script[src="${SNAP_URL}"]`,
  ) as HTMLScriptElement | null;

  const callPay = () => {
    const w = window as MidtransSnapWindow;
    if (w.snap) {
      w.snap.pay(token, callbacks);
    } else {
      callbacks.onError?.();
    }
  };

  if (existing) {
    const existingKey = existing.getAttribute('data-client-key') || undefined;
    if (clientKey && existingKey !== clientKey) {
      existing.remove();
      const s = document.createElement('script');
      s.src = SNAP_URL;
      if (clientKey) s.setAttribute('data-client-key', clientKey);
      s.onload = callPay;
      document.head.appendChild(s);
    } else {
      callPay();
    }
  } else {
    const s = document.createElement('script');
    s.src = SNAP_URL;
    if (clientKey) s.setAttribute('data-client-key', clientKey);
    s.onload = callPay;
    document.head.appendChild(s);
  }
};

export default function DonationsContent({ donations }: DonationsContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get('search')?.toLowerCase() || '';
  const payment = searchParams.get('payment');
  const orderId = searchParams.get('orderId') || searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');

  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // --- PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  // --- PAYMENT NOTICE from query params ---
  const initialNotice = useMemo<PaymentNoticeState | null>(
    () =>
      mapTransactionStatusToNotice(transactionStatus) ||
      (payment === 'success' || payment === 'pending' || payment === 'error'
        ? (payment as PaymentNoticeState)
        : null),
    [payment, transactionStatus],
  );
  const [resolvedPayment, setResolvedPayment] =
    useState<PaymentNoticeState | null>(initialNotice);
  const paymentNotice = getPaymentNotice(resolvedPayment, orderId);

  useEffect(() => {
    setResolvedPayment(initialNotice);
  }, [initialNotice]);

  // Sync donation status from query params
  useEffect(() => {
    if (!payment && !orderId && !transactionStatus) return;

    const shouldSync = !!orderId;
    const nextParams = new URLSearchParams(searchParams.toString());
    [
      'payment',
      'orderId',
      'order_id',
      'transaction_status',
      'status_code',
    ].forEach((k) => nextParams.delete(k));
    const nextUrl = nextParams.toString()
      ? `${pathname}?${nextParams}`
      : pathname;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const runSync = async () => {
      if (shouldSync) {
        const maxAttempts = payment === 'success' ? 6 : 3;
        for (let i = 0; i < maxAttempts; i++) {
          if (cancelled) return;
          try {
            const res = await fetch('/api/webhook/midtrans/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId }),
            });
            if (res.ok) {
              const payload = await res.json().catch(() => ({}));
              const status = payload?.data?.paymentStatus as string | undefined;
              const notice = mapDonationStatusToNotice(status);
              if (notice) setResolvedPayment(notice);
              router.refresh();
              if (status && status !== 'PENDING') break;
            }
          } catch {
            /* ignore */
          }
          if (i < maxAttempts - 1)
            await new Promise((r) => setTimeout(r, 1500));
        }
      }
      if (cancelled) return;
      timeout = setTimeout(() => router.replace(nextUrl), 2500);
    };

    void runSync();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [orderId, pathname, payment, router, searchParams, transactionStatus]);

  // --- FILTERED + PAGINATED DATA ---
  const filteredData = donations.filter(
    (item) =>
      (item.report?.title || 'platform').toLowerCase().includes(query) ||
      item.paymentMethod.toLowerCase().includes(query) ||
      item.paymentStatus.toLowerCase().includes(query),
  );
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentItems = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // --- Complete Payment (use existing snapToken) ---
  const handleCompletePayment = (row: DonationItem) => {
    if (!row.snapToken) {
      // Token missing → redirect to donation page with pre-filled data
      const params = new URLSearchParams();
      if (row.reportId) params.set('reportId', String(row.reportId));
      params.set('amount', String(row.amount));
      params.set('paymentMethod', row.paymentMethod);
      params.set('from', 'history');
      router.push(`/donation?${params.toString()}`);
      return;
    }

    setProcessingId(row.id);
    setActionError(null);

    loadSnapAndPay(row.snapToken, undefined, {
      onSuccess: async () => {
        if (row.midtransOrderId) {
          try {
            await fetch('/api/webhook/midtrans/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: row.midtransOrderId }),
            });
          } catch {
            /* ignore */
          }
        }
        router.refresh();
        setProcessingId(null);
      },
      onPending: () => {
        router.refresh();
        setProcessingId(null);
      },
      onError: () => {
        setActionError(
          'Payment failed. Please try changing payment method or try again.',
        );
        setProcessingId(null);
      },
      onClose: () => {
        setProcessingId(null);
      },
    });
  };

  // --- Change Payment Method (cancel old → redirect to /donation) ---
  const handleChangePaymentMethod = async (row: DonationItem) => {
    setCancelingId(row.id);
    setActionError(null);

    try {
      const res = await fetch(`/api/donation/${row.id}`, { method: 'PATCH' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(
          body?.error?.message ||
            'Failed to cancel donation. Please try again.',
        );
        setCancelingId(null);
        return;
      }
    } catch {
      setActionError('Network error. Please try again.');
      setCancelingId(null);
      return;
    }

    // After cancel, redirect to /donation/report/{id} or /donation/platform
    const redirectUrl = row.reportId
      ? `/donation/report/${row.reportId}`
      : '/donation/platform';
    router.push(redirectUrl);
  };

  const toggleExpand = (id: number) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
    setActionError(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Payment Notice Banner */}
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

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[32px] font-black text-[#193C1F]">
            Donation History
          </h2>
          <p className="text-[#8EA087] font-medium">
            {query
              ? `Showing results for "${query}"`
              : 'Your contributions to the community.'}
          </p>
        </div>
        <button
          onClick={() => router.push('/donation')}
          className="px-7 py-3.5 bg-[#8EA087] hover:bg-[#193C1F] text-white rounded-2xl font-bold text-[14px] transition-all shadow-lg whitespace-nowrap"
        >
          + New Donation
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D0D5CB] rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[#F7F3ED] text-[11px] text-[#8EA087] font-black uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Source / Donor</th>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Via</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Amount</th>
            </tr>
          </thead>

          {currentItems.length > 0 ? (
            currentItems.map((row) => {
              const displayStatus = getDisplayStatus(row.paymentStatus);
              const badge = STATUS_BADGE[displayStatus];
              const isPending = displayStatus === 'PENDING';
              const isExpanded = expandedRowId === row.id;
              const isProcessing = processingId === row.id;
              const isCanceling = cancelingId === row.id;

              return (
                <tbody
                  key={row.id}
                  onMouseEnter={() => setHoveredRowId(row.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  className="group border-b border-[#F7F3ED] last:border-0"
                >
                  {/* Main Row */}
                  <tr
                    onClick={() => toggleExpand(row.id)}
                    className={`transition-colors cursor-pointer ${
                      hoveredRowId === row.id || isExpanded
                        ? 'bg-[#FDFCFB]'
                        : ''
                    }`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-bold text-[#193C1F]">
                            {row.report?.title || 'CareConnect Platform'}
                          </p>
                          <p className="text-[12px] text-[#8EA087] font-medium opacity-60">
                            Donation #{row.id}
                          </p>
                        </div>
                        {isPending && (
                          <span className="ml-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 font-bold whitespace-nowrap">
                            Click to pay
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 font-medium">
                      {formatDateLabel(row.timestamp)}
                    </td>
                    <td className="px-8 py-6 font-medium italic text-[#8EA087]">
                      {formatPaymentMethod(row.paymentMethod)}
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right font-black text-[16px]">
                      {formatRupiah(row.amount)}
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  <tr>
                    <td colSpan={5} className="p-0">
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-in-out bg-[#FDFCFB] ${
                          isExpanded ? 'max-h-[900px]' : 'max-h-0'
                        }`}
                      >
                        <div className="px-8 pb-8 pt-2">
                          <div className="p-7 bg-white border border-[#D0D5CB]/40 rounded-[24px] shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              {/* Left: Donation Summary */}
                              <div className="space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8EA087]">
                                  Donation Summary
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Amount
                                    </p>
                                    <p className="text-[20px] font-black text-[#D1B698]">
                                      {formatRupiah(row.amount)}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Payment Method
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {formatPaymentMethod(row.paymentMethod)}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Status
                                    </p>
                                    <span
                                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${badge.cls}`}
                                    >
                                      {badge.label}
                                    </span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Date
                                    </p>
                                    <p className="text-[14px] font-bold text-[#193C1F]">
                                      {formatDateLabel(row.timestamp)}
                                    </p>
                                  </div>
                                </div>

                                {/* Action Buttons for PENDING */}
                                {isPending && (
                                  <div className="pt-2 space-y-3">
                                    {actionError &&
                                      expandedRowId === row.id && (
                                        <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                          {actionError}
                                        </p>
                                      )}

                                    {/* Complete Payment Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCompletePayment(row);
                                      }}
                                      disabled={isProcessing || isCanceling}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#193C1F] text-white rounded-xl font-bold text-[13px] hover:bg-[#8EA087] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isProcessing ? (
                                        <>
                                          <svg
                                            className="animate-spin h-4 w-4"
                                            viewBox="0 0 24 24"
                                          >
                                            <circle
                                              className="opacity-25"
                                              cx="12"
                                              cy="12"
                                              r="10"
                                              stroke="currentColor"
                                              strokeWidth="4"
                                              fill="none"
                                            />
                                            <path
                                              className="opacity-75"
                                              fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                          </svg>
                                          Opening payment...
                                        </>
                                      ) : (
                                        <>
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                            />
                                          </svg>
                                          Complete Payment
                                        </>
                                      )}
                                    </button>

                                    {/* Change Payment Method Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void handleChangePaymentMethod(row);
                                      }}
                                      disabled={isProcessing || isCanceling}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#D0D5CB] text-[#193C1F] rounded-xl font-bold text-[13px] hover:bg-[#F7F3ED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isCanceling ? (
                                        <>
                                          <svg
                                            className="animate-spin h-4 w-4"
                                            viewBox="0 0 24 24"
                                          >
                                            <circle
                                              className="opacity-25"
                                              cx="12"
                                              cy="12"
                                              r="10"
                                              stroke="currentColor"
                                              strokeWidth="4"
                                              fill="none"
                                            />
                                            <path
                                              className="opacity-75"
                                              fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                          </svg>
                                          Canceling old donation...
                                        </>
                                      ) : (
                                        <>
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                          </svg>
                                          Change Payment Method
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Right: Target Report */}
                              <div className="border-l border-[#F7F3ED] pl-10 space-y-6">
                                <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8EA087]">
                                  Target Report
                                </h4>
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight">
                                      Case Title
                                    </p>
                                    <p className="text-[16px] font-bold text-[#193C1F]">
                                      {row.report?.title ||
                                        'CareConnect Platform'}
                                    </p>
                                  </div>
                                  {row.report?.description ? (
                                    <div className="pt-2">
                                      <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight mb-1">
                                        Description
                                      </p>
                                      <div className="bg-[#F7F3ED]/30 p-4 rounded-xl border border-[#F7F3ED] max-h-[150px] overflow-y-auto custom-scrollbar">
                                        <p className="text-[13px] leading-relaxed text-[#193C1F]/80 whitespace-pre-wrap font-medium italic">
                                          &quot;{row.report.description}&quot;
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="pt-2">
                                      <p className="text-[10px] text-[#8EA087] font-bold uppercase tracking-tight mb-1">
                                        Description
                                      </p>
                                      <p className="text-[13px] text-[#193C1F]/60 italic">
                                        Donation to support the platform
                                        infrastructure and operations.
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              );
            })
          ) : (
            <tbody className="text-[14px] text-[#193C1F]">
              <tr>
                <td
                  colSpan={5}
                  className="p-20 text-center text-[#8EA087] font-bold"
                >
                  No donations found.
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page: number) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
