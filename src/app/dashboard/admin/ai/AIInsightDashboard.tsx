'use client';

import { Card } from '@/components/card';
import type {
  PeriodFilter,
  SectionStatisticalAnalysis,
  StatisticalAnalysisAPIResponse,
  StatisticalAnalysisResponseData,
} from '@/modules/ai/ai.type';
import {
  AlertTriangle,
  BrainCircuit,
  CalendarDays,
  FileText,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SectionPanel, StatCard } from './components/AIInsightSections';

type DataSource = 'all' | 'reports' | 'consultations';

const periods: { value: PeriodFilter; label: string }[] = [
  { value: '1w', label: '1 minggu' },
  { value: '1m', label: '1 bulan' },
  { value: '3m', label: '3 bulan' },
  { value: '6m', label: '6 bulan' },
  { value: '1y', label: '1 tahun' },
  { value: 'all', label: 'Semua waktu' },
];

const sampleSizes = [5, 10, 20, 50, 100];
const numberFormat = new Intl.NumberFormat('id-ID');
const categoryLabel = (category: string) =>
  category.replaceAll('_', ' ').toLocaleLowerCase('id-ID');

export function AIInsightDashboard() {
  const [period, setPeriod] = useState<PeriodFilter>('1m');
  const [sampleSize, setSampleSize] = useState(10);
  const [source, setSource] = useState<DataSource>('all');
  const [category, setCategory] = useState('all');
  const [data, setData] = useState<StatisticalAnalysisResponseData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        period,
        sampleSize: String(sampleSize),
      });
      const response = await fetch(
        `/api/dashboard/admin/ai/statistics?${params.toString()}`,
        { cache: 'no-store' },
      );
      const result = (await response.json()) as StatisticalAnalysisAPIResponse;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.error || 'Data insight gagal dimuat. Coba lagi.',
        );
      }
      setData(result.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Data insight gagal dimuat. Coba lagi.',
      );
    } finally {
      setLoading(false);
    }
  }, [period, sampleSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const availableCategories = useMemo(() => {
    if (!data) return [];
    const sections =
      source === 'reports'
        ? [data.reports]
        : source === 'consultations'
          ? [data.consultations]
          : [data.reports, data.consultations];
    return [
      ...new Set(
        sections.flatMap((section) =>
          section.categoryBreakdown.map((item) => item.category),
        ),
      ),
    ].sort();
  }, [data, source]);

  useEffect(() => {
    if (category !== 'all' && !availableCategories.includes(category)) {
      setCategory('all');
    }
  }, [availableCategories, category]);

  const shownData = useMemo(() => {
    if (!data) return null;
    const filterSection = (section: SectionStatisticalAnalysis) => {
      if (category === 'all') return section;
      const categoryBreakdown = section.categoryBreakdown.filter(
        (item) => item.category === category,
      );
      const stratifiedSample = section.stratifiedSample.filter(
        (item) => item.category === category,
      );
      return {
        ...section,
        totalCount: categoryBreakdown[0]?.count ?? 0,
        categoryBreakdown,
        stratifiedSample,
        sampleSize: stratifiedSample.length,
        dominantCategory: categoryBreakdown[0]
          ? {
              ...categoryBreakdown[0],
              attentionRequired:
                categoryBreakdown[0].percentage >= 30 ||
                categoryBreakdown[0].count >= 3,
            }
          : null,
        insights: {
          ...section.insights,
          summary: categoryBreakdown[0]
            ? `Kategori ${categoryLabel(category)} mencakup ${numberFormat.format(categoryBreakdown[0].count)} data (${categoryBreakdown[0].percentage}%) pada periode terpilih.`
            : `Tidak ada data kategori ${categoryLabel(category)} pada periode ini.`,
          recommendation: categoryBreakdown[0]
            ? `Tinjau sampel kategori ${categoryLabel(category)} dan gunakan konteks lapangan sebelum menentukan tindak lanjut.`
            : `Belum ada tindak lanjut khusus untuk kategori ${categoryLabel(category)} pada periode ini.`,
          priorityCategories: categoryBreakdown.map((item) => item.category),
        },
      };
    };
    return {
      reports: filterSection(data.reports),
      consultations: filterSection(data.consultations),
    };
  }, [category, data]);

  const exportCsv = (type: 'Laporan' | 'Konsultasi') => {
    const section =
      type === 'Laporan' ? shownData?.reports : shownData?.consultations;
    if (!section) return;
    const rows = [
      ['ID', 'Kategori', 'Jenis', 'Tanggal'],
      ...section.stratifiedSample.map((item) => [
        String(item.id),
        item.category,
        type,
        new Date(item.date).toLocaleDateString('id-ID'),
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','),
      )
      .join('\r\n');
    const blobUrl = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `sampel-${type.toLocaleLowerCase('id-ID')}-${period}.csv`;
    link.click();
    URL.revokeObjectURL(blobUrl);
  };

  const periodName = periods.find((item) => item.value === period)?.label;
  const reportCount = shownData?.reports.totalCount ?? 0;
  const consultationCount = shownData?.consultations.totalCount ?? 0;

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-10 md:space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-[#193c1f] px-6 py-8 text-white shadow-sm sm:px-9 sm:py-10">
        <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full border-[40px] border-white/[0.04]" />
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#e3eadf]">
            <BrainCircuit size={15} /> AI Insight
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Ringkasan pola data CareConnect
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d3dfd0] sm:text-base">
            Pantau sebaran laporan dan konsultasi, lihat kategori prioritas,
            lalu tinjau sampel data untuk membantu keputusan pengelola.
          </p>
        </div>
      </section>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#687563]">
                Rentang waktu
              </span>
              <span className="relative block">
                <CalendarDays
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#74816f]"
                  size={16}
                />
                <select
                  value={period}
                  onChange={(event) =>
                    setPeriod(event.target.value as PeriodFilter)
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-[#dce2d7] bg-white pl-10 pr-3 text-sm font-medium text-[#344235] outline-none focus:border-[#68836a] focus:ring-2 focus:ring-[#68836a]/15"
                >
                  {periods.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#687563]">
                Sumber data
              </span>
              <select
                value={source}
                onChange={(event) =>
                  setSource(event.target.value as DataSource)
                }
                className="h-11 w-full rounded-xl border border-[#dce2d7] bg-white px-3 text-sm font-medium text-[#344235] outline-none focus:border-[#68836a] focus:ring-2 focus:ring-[#68836a]/15"
              >
                <option value="all">Laporan & konsultasi</option>
                <option value="reports">Laporan</option>
                <option value="consultations">Konsultasi</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-[#687563]">
                Kategori
              </span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#dce2d7] bg-white px-3 text-sm font-medium capitalize text-[#344235] outline-none focus:border-[#68836a] focus:ring-2 focus:ring-[#68836a]/15"
              >
                <option value="all">Semua kategori</option>
                {availableCategories.map((item) => (
                  <option key={item} value={item}>
                    {categoryLabel(item)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label className="block min-w-[150px]">
              <span className="mb-1.5 block text-xs font-bold text-[#687563]">
                Ukuran sampel
              </span>
              <select
                value={sampleSize}
                onChange={(event) => setSampleSize(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-[#dce2d7] bg-white px-3 text-sm font-medium text-[#344235] outline-none focus:border-[#68836a] focus:ring-2 focus:ring-[#68836a]/15"
              >
                {sampleSizes.map((size) => (
                  <option key={size} value={size}>
                    {size} sampel
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {data && (
          <p className="mt-3 text-xs text-[#899286]">
            Periode {periodName} · data sampai{' '}
            {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(
              new Date(data.endDate),
            )}
          </p>
        )}
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3 text-red-800">
            <AlertTriangle className="mt-0.5 shrink-0" size={19} />
            <div className="flex-1">
              <p className="font-bold">Insight belum dapat dimuat</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => void loadData()}
              className="text-sm font-bold underline"
            >
              Coba lagi
            </button>
          </div>
        </Card>
      )}

      {loading && !data ? (
        <Card className="flex min-h-64 items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#dce2d7] border-t-[#34563a]" />
            <p className="mt-4 text-sm font-semibold text-[#687563]">
              Memuat ringkasan data…
            </p>
          </div>
        </Card>
      ) : shownData ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Laporan"
              value={reportCount}
              caption={`Dalam ${periodName}`}
              icon={FileText}
            />
            <StatCard
              label="Konsultasi"
              value={consultationCount}
              caption={`Dalam ${periodName}`}
              icon={UsersRound}
            />
            <StatCard
              label="Sampel laporan"
              value={shownData.reports.sampleSize}
              caption={`Dari target ${sampleSize} sampel`}
              icon={BrainCircuit}
            />
            <StatCard
              label="Sampel konsultasi"
              value={shownData.consultations.sampleSize}
              caption={`Dari target ${sampleSize} sampel`}
              icon={Sparkles}
            />
          </section>

          <div className="space-y-7">
            {(source === 'all' || source === 'reports') && (
              <SectionPanel
                title="Laporan"
                type="Laporan"
                data={shownData.reports}
                onExport={exportCsv}
              />
            )}
            {(source === 'all' || source === 'consultations') && (
              <SectionPanel
                title="Konsultasi"
                type="Konsultasi"
                data={shownData.consultations}
                onExport={exportCsv}
              />
            )}
          </div>

          <p className="rounded-xl border border-[#e3e7df] bg-white/70 px-4 py-3 text-xs leading-5 text-[#7b8478]">
            Sampel dipilih secara terstratifikasi dari data pada periode
            terpilih. Ringkasan otomatis membantu evaluasi awal; tinjau konteks
            data sebelum mengambil keputusan.
          </p>
        </>
      ) : null}
    </div>
  );
}
