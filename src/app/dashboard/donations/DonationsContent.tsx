'use client';

import { Badge } from '@/components/badge';
import { Button } from '@/components/button';
import { Table } from '@/components/table';
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

type PaymentNoticeState = 'success' | 'pending' | 'failed';

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

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [errorRowId, setErrorRowId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

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

  const handleCompletePayment = (row: DonationItem) => {
    if (!row.snapToken) {
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
    setErrorRowId(null);

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
        setErrorRowId(row.id);
        setProcessingId(null);
      },
      onClose: () => {
        setProcessingId(null);
      },
    });
  };

  const handleChangePaymentMethod = async (row: DonationItem) => {
    setCancelingId(row.id);
    setActionError(null);
    setErrorRowId(null);

    try {
      const res = await fetch(`/api/donation/${row.id}`, { method: 'PATCH' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(
          body?.error?.message ||
            'Failed to cancel donation. Please try again.',
        );
        setErrorRowId(row.id);
        setCancelingId(null);
        return;
      }
    } catch {
      setActionError('Network error. Please try again.');
      setErrorRowId(row.id);
      setCancelingId(null);
      return;
    }

    const redirectUrl = row.reportId
      ? `/donation/report/${row.reportId}`
      : '/donation/platform';
    router.push(redirectUrl);
  };

  return (
    <div className="w-full space-y-8 animate-fade-in">
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

      {/* Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#193c1f] tracking-tight">
            Donation Records
          </h2>
          <p className="text-[#8ea087] text-sm font-medium mt-0.5">
            {query
              ? `Showing results for "${query}"`
              : 'Detailed history log of your donations.'}
          </p>
        </div>
        <Button
          onClick={() => router.push('/donation')}
          variant="secondary"
          className="whitespace-nowrap shadow-md bg-[#193c1f] text-white hover:bg-[#132e18] shrink-0"
        >
          + New Donation
        </Button>
      </div>

      {/* Table Section */}
      <Table
        data={currentItems}
        keyExtractor={(row) => row.id}
        emptyMessage="No donations found."
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page: number) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        renderExpandedRow={(row) => {
          const displayStatus = getDisplayStatus(row.paymentStatus);
          const badge = STATUS_BADGE[displayStatus];
          const isPending = displayStatus === 'PENDING';
          const isProcessing = processingId === row.id;
          const isCanceling = cancelingId === row.id;
          return (
            <div className="p-4 sm:p-5 bg-white border border-[#d0d5cb]/40 rounded-[18px] shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left: Donation Summary */}
                <div className="space-y-6">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8ea087]">
                    Donation Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                        Amount
                      </p>
                      <p className="text-[20px] font-black text-[#193c1f]">
                        {formatRupiah(row.amount)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                        Payment Method
                      </p>
                      <p className="text-[14px] font-bold text-[#193c1f]">
                        {formatPaymentMethod(row.paymentMethod)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                        Status
                      </p>
                      <Badge className={badge.cls}>{badge.label}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                        Date
                      </p>
                      <p className="text-[14px] font-bold text-[#193c1f]">
                        {formatDateLabel(row.timestamp)}
                      </p>
                    </div>
                  </div>

                  {isPending && (
                    <div className="pt-2 space-y-3">
                      {actionError && errorRowId === row.id && (
                        <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {actionError}
                        </p>
                      )}

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompletePayment(row);
                        }}
                        disabled={isProcessing || isCanceling}
                        loading={isProcessing}
                        className="w-full rounded-xl px-4 py-3 text-[13px] bg-[#193c1f] text-white hover:bg-[#8ea087]"
                      >
                        {isProcessing
                          ? 'Opening payment...'
                          : 'Complete Payment'}
                      </Button>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleChangePaymentMethod(row);
                        }}
                        disabled={isProcessing || isCanceling}
                        loading={isCanceling}
                        variant="outline"
                        className="w-full rounded-xl px-4 py-3 text-[13px]"
                      >
                        {isCanceling
                          ? 'Canceling old donation...'
                          : 'Change Payment Method'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Right: Target Report */}
                <div className="border-l border-[#f7f3ed] pl-10 space-y-6">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#8ea087]">
                    Target Report
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight">
                        Case Title
                      </p>
                      <p className="text-[16px] font-bold text-[#193c1f]">
                        {row.report?.title || 'CareConnect Platform'}
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="text-[10px] text-[#8ea087] font-bold uppercase tracking-tight mb-1">
                        Description
                      </p>
                      <div className="bg-[#f7f3ed]/30 p-4 rounded-xl border border-[#f7f3ed] max-h-[150px] overflow-y-auto custom-scrollbar">
                        <p className="text-[13px] leading-relaxed text-[#193c1f]/80 whitespace-pre-wrap font-medium italic">
                          &quot;
                          {row.report?.description ||
                            'Donation to support the platform infrastructure and operations.'}
                          &quot;
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }}
        columns={[
          {
            header: 'Source / Donor',
            cell: (row) => {
              const displayStatus = getDisplayStatus(row.paymentStatus);
              const isPending = displayStatus === 'PENDING';
              return (
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-bold text-[#193c1f] text-sm">
                      {row.report?.title || 'CareConnect Platform'}
                    </p>
                    <p className="text-[11px] text-[#8ea087] font-medium opacity-60">
                      Donation #{row.id}
                    </p>
                  </div>
                  {isPending && (
                    <Badge className="ml-2 whitespace-nowrap border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-600">
                      Pending
                    </Badge>
                  )}
                </div>
              );
            },
          },
          {
            header: 'Date',
            cell: (row) => (
              <p className="font-medium text-[#193c1f] text-sm">
                {formatDateLabel(row.timestamp)}
              </p>
            ),
          },
          {
            header: 'Via',
            cell: (row) => (
              <p className="font-medium italic text-[#8ea087] text-sm">
                {formatPaymentMethod(row.paymentMethod)}
              </p>
            ),
          },
          {
            header: 'Status',
            cell: (row) => {
              const displayStatus = getDisplayStatus(row.paymentStatus);
              const badge = STATUS_BADGE[displayStatus];
              return <Badge className={badge.cls}>{badge.label}</Badge>;
            },
          },
          {
            header: 'Amount',
            headerClassName: 'text-right',
            className: 'text-right',
            cell: (row) => (
              <p className="font-black text-sm text-[#193c1f]">
                {formatRupiah(row.amount)}
              </p>
            ),
          },
        ]}
      />
    </div>
  );
}
