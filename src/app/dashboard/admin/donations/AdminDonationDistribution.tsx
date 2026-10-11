'use client';

import { Card } from '@/components/card';
import { Pagination } from '@/components/pagination';
import { Table } from '@/components/table';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CircleDollarSign,
  Clock3,
  HandCoins,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';

type TargetType = 'PLATFORM' | 'REPORT';
type Group = {
  id: string;
  targetType: TargetType;
  name: string;
  reportId?: number | null;
  reportTitle?: string | null;
  reportCategory?: string | null;
  incidentDate?: string | null;
  totalCollected: number;
  totalDistributed: number;
  remainingBalance: number;
  distributionCount: number;
  donationCount: number;
};
type Distribution = {
  id: number;
  targetType: TargetType;
  reportId: number | null;
  amount: number;
  recipient: string;
  notes: string | null;
  distributedAt: string;
  createdById: string;
  createdAt: string;
  report?: { id: number; title: string; category: string } | null;
  createdBy?: { id: string; name: string; email: string } | null;
};
type Donation = {
  id: number;
  amount: number;
  timestamp: string;
  donorName: string;
  donorEmail?: string | null;
  paymentStatus: string;
  paymentMethod: string;
};
type GroupDetail = {
  group: Group;
  distributions: Distribution[];
  donations: Donation[];
};
type Summary = {
  totalPlatformDonations: number;
  totalReportDonations: number;
  totalDonations: number;
  totalDistributed: number;
  totalDistributedPlatform: number;
  totalDistributedReports: number;
  remainingPlatformBalance: number;
  remainingReportBalance: number;
  totalRemainingBalance: number;
  payoutPool: number;
  operationalPool: number;
};
type HistoryResponse = {
  distributions: Distribution[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
};
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: { message?: string };
};

const GROUPS_URL = '/api/dashboard/admin/donations/distributions/groups';
const SUMMARY_URL = '/api/dashboard/admin/donations/distributions/summary';
const HISTORY_URL = '/api/dashboard/admin/donations/distributions/history';
const formatMoney = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  const result = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.error?.message || 'Permintaan gagal diproses.');
  }
  return result.data;
}

function MessageCard({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  return (
    <Card
      className={`p-6 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'text-[#687563]'}`}
    >
      {error && <AlertTriangle size={17} className="mr-2 inline-block" />}
      {message}
    </Card>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Wallet;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#74816f]">
            {label}
          </p>
          <p className="mt-3 break-words text-xl font-black text-[#193c1f] sm:text-2xl">
            {value}
          </p>
          <p className="mt-1 text-xs text-[#899286]">{description}</p>
        </div>
        <span className="rounded-xl bg-[#edf1e9] p-3 text-[#34563a]">
          <Icon size={20} />
        </span>
      </div>
    </Card>
  );
}

function HistorySection() {
  const [targetType, setTargetType] = useState<'ALL' | TargetType>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filters, setFilters] = useState({
    targetType: 'ALL' as 'ALL' | TargetType,
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({
      targetType: filters.targetType,
      page: String(page),
      limit: '10',
    });
    if (filters.startDate) params.set('startDate', filters.startDate);
    // The backend treats endDate as an inclusive timestamp; include the whole selected day.
    if (filters.endDate)
      params.set('endDate', `${filters.endDate}T23:59:59.999Z`);
    apiRequest<HistoryResponse>(`${HISTORY_URL}?${params}`)
      .then((data) => {
        if (active) setHistory(data);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : 'Riwayat gagal dimuat.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters, page]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setPage(1);
    setFilters({ targetType, startDate, endDate });
  }
  function resetFilters() {
    setLoading(true);
    setError(null);
    setTargetType('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setFilters({ targetType: 'ALL', startDate: '', endDate: '' });
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-[#193c1f]">
          Distribution History
        </h2>
        <p className="mt-1 text-sm text-[#74816f]">
          Riwayat dari catatan distribusi yang tersimpan.
        </p>
      </div>
      <Card className="p-5">
        <form
          onSubmit={applyFilters}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
        >
          <label className="text-xs font-bold text-[#687563]">
            Jenis target
            <select
              value={targetType}
              onChange={(event) =>
                setTargetType(event.target.value as 'ALL' | TargetType)
              }
              className="mt-1 block w-full rounded-xl border border-[#d0d5cb] bg-white px-3 py-2.5 text-sm text-[#193c1f]"
            >
              <option value="ALL">Semua</option>
              <option value="PLATFORM">Platform</option>
              <option value="REPORT">Report</option>
            </select>
          </label>
          <label className="text-xs font-bold text-[#687563]">
            Dari tanggal
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-[#d0d5cb] bg-white px-3 py-2.5 text-sm text-[#193c1f]"
            />
          </label>
          <label className="text-xs font-bold text-[#687563]">
            Sampai tanggal
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => setEndDate(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-[#d0d5cb] bg-white px-3 py-2.5 text-sm text-[#193c1f]"
            />
          </label>
          <button
            className="rounded-xl bg-[#193c1f] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            disabled={loading}
          >
            Terapkan filter
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-xl border border-[#d0d5cb] px-4 py-2.5 text-sm font-bold text-[#38513b]"
          >
            Reset
          </button>
        </form>
      </Card>
      {error ? (
        <MessageCard message={error} error />
      ) : loading ? (
        <MessageCard message="Memuat riwayat distribusi…" />
      ) : (
        <Table
          data={history?.distributions ?? []}
          keyExtractor={(record) => record.id}
          minWidth="min-w-[760px]"
          emptyMessage="Belum ada catatan distribusi untuk filter ini."
          currentPage={history?.page ?? 1}
          totalPages={Math.max(1, history?.totalPages ?? 1)}
          onPageChange={(nextPage) => {
            setLoading(true);
            setError(null);
            setPage(nextPage);
          }}
          paginationInfo={`${history?.totalCount ?? 0} catatan`}
          columns={[
            {
              header: 'Tanggal',
              cell: (record) => formatDate(record.distributedAt),
            },
            {
              header: 'Target',
              cell: (record) =>
                record.targetType === 'PLATFORM'
                  ? 'Platform'
                  : record.report?.title || `Report #${record.reportId}`,
            },
            { header: 'Penerima', cell: (record) => record.recipient },
            { header: 'Catatan', cell: (record) => record.notes || '—' },
            {
              header: 'Nominal',
              className: 'text-right font-bold text-[#193c1f]',
              cell: (record) => formatMoney(record.amount),
            },
          ]}
        />
      )}
    </section>
  );
}

export function AdminDonationDistribution() {
  const searchParams = useSearchParams();
  const search = (searchParams.get('search') || '').trim();
  const [targetFilter, setTargetFilter] = useState<'ALL' | 'GROUP' | 'REPORT'>(
    'ALL',
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [resolvedRequest, setResolvedRequest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportPage, setReportPage] = useState(1);
  const [reportPageSearch, setReportPageSearch] = useState(search);
  const requestKey = `${targetFilter}:${search}`;
  const loading = resolvedRequest !== requestKey;

  useEffect(() => {
    let active = true;
    const currentRequest = `${targetFilter}:${search}`;
    const params = new URLSearchParams({
      targetType:
        targetFilter === 'GROUP'
          ? 'PLATFORM'
          : targetFilter === 'REPORT'
            ? 'REPORT'
            : 'ALL',
    });
    if (search) params.set('search', search);
    const filteredGroupsRequest = apiRequest<{ groups: Group[] }>(
      `${GROUPS_URL}?${params}`,
    );
    const allGroupsRequest =
      targetFilter === 'ALL' && !search
        ? filteredGroupsRequest
        : apiRequest<{ groups: Group[] }>(`${GROUPS_URL}?targetType=ALL`);
    Promise.all([
      filteredGroupsRequest,
      allGroupsRequest,
      apiRequest<Summary>(SUMMARY_URL),
    ])
      .then(([groupData, allGroupData, summaryData]) => {
        if (active) {
          setError(null);
          setGroups(groupData.groups);
          setAllGroups(allGroupData.groups);
          setSummary(summaryData);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Data distribusi gagal dimuat.',
          );
      })
      .finally(() => {
        if (active) setResolvedRequest(currentRequest);
      });
    return () => {
      active = false;
    };
  }, [search, targetFilter]);

  const managedTargetCount = allGroups.filter(
    (group) =>
      (group.targetType === 'PLATFORM' || group.donationCount > 0) &&
      group.remainingBalance > 0,
  ).length;

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 pb-10">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8ea087]">
          Admin · Donations
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#193c1f] sm:text-3xl">
          Distribution Management
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#687563]">
          Kelola penyaluran dana platform dan donasi per laporan berdasarkan
          saldo.
        </p>
      </header>
      <div className="max-w-xs">
        <label
          htmlFor="distribution-target-filter"
          className="text-xs font-bold text-[#687563]"
        >
          Jenis target
        </label>
        <select
          id="distribution-target-filter"
          value={targetFilter}
          onChange={(event) => {
            setTargetFilter(event.target.value as typeof targetFilter);
            setReportPage(1);
            setReportPageSearch(search);
          }}
          className="mt-1 block w-full rounded-xl border border-[#d0d5cb] bg-white px-3 py-2.5 text-sm text-[#193c1f]"
        >
          <option value="ALL">Semua target</option>
          <option value="GROUP">Group (Platform)</option>
          <option value="REPORT">Report</option>
        </select>
      </div>
      {loading ? (
        <MessageCard message="Sedang memuat data distribusi…" />
      ) : error ? (
        <MessageCard message={error} error />
      ) : !summary ? (
        <MessageCard message="Ringkasan distribusi belum tersedia." />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Donasi memenuhi syarat"
            value={formatMoney(summary.totalDonations)}
            description="Total donasi berstatus PAID"
            icon={CircleDollarSign}
          />
          <SummaryCard
            label="Total disalurkan"
            value={formatMoney(summary.totalDistributed)}
            description="Catatan distribusi tersimpan"
            icon={HandCoins}
          />
          <SummaryCard
            label="Sisa dana"
            value={formatMoney(summary.totalRemainingBalance)}
            description="Saldo platform dan seluruh laporan"
            icon={Wallet}
          />
          <SummaryCard
            label="Target perlu dikelola"
            value={String(managedTargetCount)}
            description="Target dengan saldo yang masih tersedia"
            icon={Wallet}
          />
        </section>
      )}

      {loading || error ? null : (
        <>
          {(targetFilter === 'GROUP'
            ? (['PLATFORM'] as const)
            : targetFilter === 'REPORT'
              ? (['REPORT'] as const)
              : (['PLATFORM', 'REPORT'] as const)
          ).map((targetType) => {
            const eligibleGroups = groups.filter(
              (group) =>
                group.targetType === 'PLATFORM' || group.donationCount > 0,
            );
            const targetGroups = eligibleGroups.filter(
              (group) => group.targetType === targetType,
            );
            const totalPages = Math.ceil(targetGroups.length / 10);
            const currentPage =
              targetType === 'REPORT' && reportPageSearch === search
                ? Math.min(reportPage, Math.max(totalPages, 1))
                : 1;
            const visibleGroups =
              targetType === 'REPORT'
                ? targetGroups.slice((currentPage - 1) * 10, currentPage * 10)
                : targetGroups;
            return (
              <section key={targetType} className="space-y-4">
                <div>
                  <h2 className="text-xl font-black text-[#193c1f]">
                    {targetType === 'PLATFORM'
                      ? 'Platform Donation Distribution'
                      : 'Report Donation Distribution'}
                  </h2>
                  <p className="mt-1 text-sm text-[#74816f]">
                    {targetType === 'PLATFORM'
                      ? 'Dana platform sesuai pengelompokan.'
                      : 'Saldo dan riwayat tiap laporan ditampilkan terpisah.'}
                  </p>
                </div>
                {targetGroups.length ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {visibleGroups.map((group) => {
                      const href = `/dashboard/admin/donations/distributions/${targetType === 'PLATFORM' ? 'platform/platform' : `report/${group.id}`}`;
                      return (
                        <Link
                          key={`${group.targetType}-${group.id}`}
                          href={href}
                          className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#68836a]"
                        >
                          <Card className="h-full p-5 transition hover:border-[#8ea087] hover:shadow-md">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="rounded-full bg-[#edf1e9] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#38513b]">
                                  {targetType === 'PLATFORM'
                                    ? 'Platform'
                                    : `Report #${group.reportId ?? group.id}`}
                                </span>
                                <h3 className="mt-3 break-words text-lg font-black text-[#193c1f]">
                                  {group.name}
                                </h3>
                                {group.reportCategory && (
                                  <p className="mt-1 text-xs text-[#74816f]">
                                    {group.reportCategory}
                                  </p>
                                )}
                              </div>
                              <ArrowRight
                                size={19}
                                className="shrink-0 text-[#68836a]"
                              />
                            </div>
                            <dl className="mt-5 grid grid-cols-2 gap-4">
                              {[
                                ['Dana terkumpul', group.totalCollected],
                                ['Dana disalurkan', group.totalDistributed],
                                ['Sisa dana', group.remainingBalance],
                                [
                                  'Kondisi saldo',
                                  group.remainingBalance > 0
                                    ? 'Masih tersedia'
                                    : 'Saldo habis',
                                ],
                              ].map(([label, value]) => (
                                <div key={String(label)}>
                                  <dt className="text-[10px] font-bold uppercase tracking-wider text-[#899286]">
                                    {label}
                                  </dt>
                                  <dd className="mt-1 break-words font-bold text-[#193c1f]">
                                    {typeof value === 'number'
                                      ? formatMoney(value)
                                      : value}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                            <p className="mt-4 border-t border-[#f0f2ed] pt-3 text-xs text-[#74816f]">
                              {group.donationCount} donasi ·{' '}
                              {group.distributionCount} catatan distribusi
                            </p>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <MessageCard
                    message={
                      search
                        ? 'Tidak ada target yang cocok dengan pencarian.'
                        : `Belum ada target ${targetType === 'PLATFORM' ? 'platform' : 'laporan'}.`
                    }
                  />
                )}
                {targetType === 'REPORT' && totalPages > 1 && (
                  <>
                    <p className="text-center text-xs text-[#74816f]">
                      Menampilkan {(currentPage - 1) * 10 + 1}–
                      {Math.min(currentPage * 10, targetGroups.length)} dari{' '}
                      {targetGroups.length} laporan
                    </p>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(nextPage) => {
                        setReportPageSearch(search);
                        setReportPage(nextPage);
                      }}
                    />
                  </>
                )}
              </section>
            );
          })}
        </>
      )}
      <HistorySection />
    </div>
  );
}

export function AdminDonationDistributionDetail({
  groupType,
  groupId,
}: {
  groupType: 'platform' | 'report';
  groupId: string;
}) {
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [distributedAt, setDistributedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const groupUrl = `${GROUPS_URL}/${encodeURIComponent(groupId)}`;
  const loadDetail = useCallback(() => {
    let active = true;
    setLoading(true);
    setError(null);
    apiRequest<GroupDetail>(groupUrl)
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Detail distribusi gagal dimuat.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [groupUrl]);
  useEffect(() => loadDetail(), [loadDetail, reload]);

  async function submitDistribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail) return;
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setFormError('Masukkan nominal lebih dari Rp 0.');
      return;
    }
    if (amountNumber > detail.group.remainingBalance) {
      setFormError(
        `Nominal melebihi saldo tersedia ${formatMoney(detail.group.remainingBalance)}.`,
      );
      return;
    }
    if (!recipient.trim()) {
      setFormError('Tujuan/penerima distribusi wajib diisi.');
      return;
    }
    setSaving(true);
    setFormError(null);
    setSuccess(null);
    try {
      await apiRequest<Distribution>(
        '/api/dashboard/admin/donations/distributions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetType: detail.group.targetType,
            ...(detail.group.targetType === 'REPORT'
              ? { reportId: detail.group.reportId }
              : {}),
            amount: amountNumber,
            recipient: recipient.trim(),
            distributedAt: distributedAt || null,
            notes: notes.trim() || null,
          }),
        },
      );
      setAmount('');
      setRecipient('');
      setDistributedAt('');
      setNotes('');
      setSuccess('Catatan distribusi berhasil disimpan.');
      setReload((value) => value + 1);
    } catch (cause) {
      setFormError(
        cause instanceof Error
          ? cause.message
          : 'Catatan distribusi gagal disimpan.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <MessageCard message="Memuat detail distribusi…" />;
  if (error || !detail)
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <MessageCard
          message={error || 'Detail distribusi tidak tersedia.'}
          error
        />
        <Link
          href="/dashboard/admin/donations/distributions"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#38513b] hover:underline"
        >
          <ArrowLeft size={17} />
          Kembali ke Distribution Management
        </Link>
      </div>
    );
  const { group, donations, distributions } = detail;
  if (
    (groupType === 'platform' && group.targetType !== 'PLATFORM') ||
    (groupType === 'report' && group.targetType !== 'REPORT')
  )
    return (
      <MessageCard message="Jenis target tidak sesuai dengan detail." error />
    );
  const canDistribute = group.remainingBalance > 0;

  return (
    <div className="mx-auto max-w-[1280px] space-y-6 pb-10">
      <Link
        href="/dashboard/admin/donations/distributions"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#38513b] hover:underline"
      >
        <ArrowLeft size={17} />
        Kembali ke Distribution Management
      </Link>
      <header>
        <span className="rounded-full bg-[#edf1e9] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#38513b]">
          {group.targetType === 'PLATFORM'
            ? 'Platform Donation Distribution'
            : 'Report Donation Distribution'}
        </span>
        <h1 className="mt-3 break-words text-2xl font-black tracking-tight text-[#193c1f] sm:text-3xl">
          {group.name}
        </h1>
        <p className="mt-2 text-sm text-[#687563]">
          {group.reportId
            ? `Report #${group.reportId}${group.reportCategory ? ` · ${group.reportCategory}` : ''}`
            : 'Target distribusi platform'}
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Donasi terkumpul"
          value={formatMoney(group.totalCollected)}
          description={`${group.donationCount} donasi`}
          icon={CircleDollarSign}
        />
        <SummaryCard
          label="Dana disalurkan"
          value={formatMoney(group.totalDistributed)}
          description={`${group.distributionCount} catatan`}
          icon={HandCoins}
        />
        <SummaryCard
          label="Saldo tersedia"
          value={formatMoney(group.remainingBalance)}
          description={
            canDistribute
              ? 'Tersedia untuk disalurkan'
              : 'Tidak ada saldo untuk disalurkan'
          }
          icon={Wallet}
        />
      </section>
      <Card className="p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-black text-[#193c1f]">
            Process Distribution
          </h2>
          <p className="mt-1 text-sm text-[#74816f]">
            Saldo tersedia:{' '}
            <strong className="text-[#193c1f]">
              {formatMoney(group.remainingBalance)}
            </strong>
          </p>
        </div>
        {!canDistribute && (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Penyaluran dinonaktifkan karena saldo tersedia Rp 0.
          </p>
        )}
        {formError && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {formError}
          </p>
        )}
        {success && (
          <p
            role="status"
            className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          >
            {success}
          </p>
        )}
        <form
          onSubmit={submitDistribution}
          className="grid gap-4 sm:grid-cols-2"
        >
          <label className="text-xs font-bold text-[#687563]">
            Tujuan / penerima
            <input
              required
              maxLength={255}
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              disabled={!canDistribute || saving}
              className="mt-1 block w-full rounded-xl border border-[#d0d5cb] px-3 py-2.5 text-sm font-normal text-[#193c1f] disabled:bg-gray-100"
              placeholder="Nama penerima atau tujuan"
            />
          </label>
          <label className="text-xs font-bold text-[#687563]">
            Nominal distribusi
            <input
              required
              type="number"
              min="1"
              max={group.remainingBalance}
              step="1"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={!canDistribute || saving}
              className="mt-1 block w-full rounded-xl border border-[#d0d5cb] px-3 py-2.5 text-sm font-normal text-[#193c1f] disabled:bg-gray-100"
              placeholder="Masukkan nominal"
            />
          </label>
          <label className="text-xs font-bold text-[#687563]">
            Tanggal distribusi
            <input
              type="date"
              value={distributedAt}
              onChange={(event) => setDistributedAt(event.target.value)}
              disabled={!canDistribute || saving}
              className="mt-1 block w-full rounded-xl border border-[#d0d5cb] px-3 py-2.5 text-sm font-normal text-[#193c1f] disabled:bg-gray-100"
            />
          </label>
          <label className="text-xs font-bold text-[#687563] sm:col-span-2">
            Catatan
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={!canDistribute || saving}
              rows={3}
              className="mt-1 block w-full rounded-xl border border-[#d0d5cb] px-3 py-2.5 text-sm font-normal text-[#193c1f] disabled:bg-gray-100"
            />
          </label>
          <button
            type="submit"
            disabled={!canDistribute || saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#193c1f] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-2"
          >
            <HandCoins size={17} />
            {saving ? 'Menyimpan…' : 'Process Distribution'}
          </button>
        </form>
      </Card>
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CircleDollarSign size={18} className="text-[#38513b]" />
          <h2 className="text-lg font-black text-[#193c1f]">
            Donation Transactions
          </h2>
        </div>
        <Table
          data={donations}
          keyExtractor={(donation) => donation.id}
          minWidth="min-w-[680px]"
          emptyMessage="Belum ada transaksi donasi untuk kelompok ini."
          columns={[
            { header: 'ID', cell: (donation) => `#${donation.id}` },
            { header: 'Donatur', cell: (donation) => donation.donorName },
            {
              header: 'Status pembayaran',
              cell: (donation) => donation.paymentStatus,
            },
            {
              header: 'Tanggal',
              cell: (donation) => formatDate(donation.timestamp),
            },
            {
              header: 'Nominal',
              className: 'text-right font-bold text-[#193c1f]',
              cell: (donation) => formatMoney(donation.amount),
            },
          ]}
        />
      </section>
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock3 size={18} className="text-[#38513b]" />
          <h2 className="text-lg font-black text-[#193c1f]">
            Distribution History
          </h2>
        </div>
        <Table
          data={distributions}
          keyExtractor={(record) => record.id}
          minWidth="min-w-[680px]"
          emptyMessage="Belum ada catatan distribusi untuk kelompok ini."
          columns={[
            {
              header: 'Tanggal',
              cell: (record) => formatDate(record.distributedAt),
            },
            { header: 'Penerima', cell: (record) => record.recipient },
            { header: 'Catatan', cell: (record) => record.notes || '—' },
            {
              header: 'Nominal',
              className: 'text-right font-bold text-[#193c1f]',
              cell: (record) => formatMoney(record.amount),
            },
          ]}
        />
      </section>
    </div>
  );
}
