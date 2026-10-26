'use client';

import { Card } from '@/components/card';
import { Table } from '@/components/table';
import type {
  ClassifyAPIResponse,
  ClassifyResultItem,
  SectionStatisticalAnalysis,
} from '@/modules/ai/ai.type';
import {
  AlertTriangle,
  BrainCircuit,
  Download,
  type LucideIcon,
  PieChart,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const numberFormat = new Intl.NumberFormat('id-ID');
const categoryLabel = (category: string) =>
  category.replaceAll('_', ' ').toLocaleLowerCase('id-ID');

export function StatCard({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  caption: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#74816f]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-[#193c1f]">
            {typeof value === 'number' ? numberFormat.format(value) : value}
          </p>
          <p className="mt-1 text-sm text-[#7b8478]">{caption}</p>
        </div>
        <div className="rounded-2xl bg-[#edf1e9] p-3 text-[#34563a]">
          <Icon size={21} />
        </div>
      </div>
    </Card>
  );
}

export function SectionPanel({
  type,
  data,
  onExport,
}: {
  type: 'Laporan' | 'Konsultasi';
  data: SectionStatisticalAnalysis;
  onExport: (type: 'Laporan' | 'Konsultasi') => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [predictions, setPredictions] = useState<
    Record<string, ClassifyResultItem>
  >({});
  const [classifying, setClassifying] = useState(false);
  const [classificationError, setClassificationError] = useState<string | null>(
    null,
  );
  const pageSize = 5;
  const totalPages = Math.ceil(data.stratifiedSample.length / pageSize);
  const pageData = data.stratifiedSample.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const maxCount = Math.max(
    ...data.categoryBreakdown.map((item) => item.count),
    1,
  );
  const leadingCategory = data.categoryBreakdown[0];

  useEffect(() => {
    setCurrentPage(1);
    setPredictions({});
    setClassificationError(null);
  }, [data.stratifiedSample]);

  const classifySample = async () => {
    setClassifying(true);
    setClassificationError(null);
    try {
      const response = await fetch('/api/dashboard/admin/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: data.stratifiedSample.map(({ id, title, description }) => ({
            id,
            title,
            description,
          })),
        }),
      });
      const result = (await response.json()) as ClassifyAPIResponse;
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Prediksi kategori gagal dilakukan.');
      }
      setPredictions(
        Object.fromEntries(
          result.data.results
            .filter((item) => item.id !== undefined)
            .map((item) => [String(item.id), item]),
        ),
      );
    } catch (error) {
      setClassificationError(
        error instanceof Error
          ? error.message
          : 'Prediksi kategori gagal dilakukan.',
      );
    } finally {
      setClassifying(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-3xl border border-[#dce5d8] bg-white shadow-sm">
          <div className="border-b border-[#e9eee6] bg-gradient-to-r from-[#f2f6ef] to-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#193c1f] p-2.5 text-white">
                  <PieChart size={19} />
                </div>
                <div>
                  <h3 className="font-bold text-[#193c1f]">Sebaran kategori</h3>
                  <p className="mt-1 text-xs text-[#74816f]">
                    {numberFormat.format(data.totalCount)}{' '}
                    {type.toLocaleLowerCase('id-ID')} berdasarkan kategori
                  </p>
                </div>
              </div>
              <span className="rounded-lg border border-[#dce5d8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#53604f]">
                {data.categoryBreakdown.length} kategori
              </span>
            </div>
          </div>
          {data.categoryBreakdown.length ? (
            <div className="space-y-5 p-5 sm:p-6">
              {leadingCategory && (
                <div className="rounded-2xl border border-[#dce8d8] bg-[#f5f8f3] p-4 sm:p-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#74816f]">
                    Kategori terbanyak
                  </p>
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xl font-black capitalize tracking-tight text-[#193c1f] sm:text-2xl">
                        {categoryLabel(leadingCategory.category)}
                      </p>
                      <p className="mt-1 text-sm text-[#687563]">
                        {numberFormat.format(leadingCategory.count)}{' '}
                        {type.toLocaleLowerCase('id-ID')}
                      </p>
                    </div>
                    <p className="text-3xl font-black tracking-tight text-[#315d37] sm:text-4xl">
                      {leadingCategory.percentage}%
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {data.categoryBreakdown.map((item, index) => (
                  <div key={item.category}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold capitalize text-[#344235]">
                        {categoryLabel(item.category)}
                      </span>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-[#53604f]">
                        {numberFormat.format(item.count)}
                        <span className="ml-2 text-[#899286]">
                          {item.percentage}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#eef0eb]">
                      <div
                        className={`h-full rounded-full ${index === 0 ? 'bg-[#315d37]' : 'bg-[#8ea087]'}`}
                        style={{
                          width: `${Math.max(2, (item.count / maxCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="m-5 rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-[#899286] sm:m-6">
              Belum ada data kategori pada periode ini.
            </p>
          )}
        </section>

        <div className="overflow-hidden rounded-3xl border border-[#D0D5CB]/50 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 p-5 sm:p-6">
            <div>
              <h3 className="font-bold text-[#193c1f]">
                Sampel terstratifikasi · {type}
              </h3>
              <p className="mt-1 text-xs text-[#899286]">
                {numberFormat.format(data.sampleSize)} dari{' '}
                {numberFormat.format(data.totalCount)} data · identitas pelapor
                tidak ditampilkan
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f2ed] px-5 py-3 sm:px-6">
            <p className="text-xs text-[#7b8478]">
              Jalankan classifier untuk melihat prediksi kategori dan confidence
              pada sampel ini.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onExport(type)}
                disabled={data.stratifiedSample.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-[#dce2d7] px-3 py-2 text-xs font-bold text-[#38513b] transition hover:bg-[#f7f8f5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download size={14} /> CSV
              </button>
              <button
                type="button"
                onClick={() => void classifySample()}
                disabled={classifying || data.stratifiedSample.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#193c1f] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#2d5a35] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <BrainCircuit size={14} />
                {classifying ? 'Menganalisis sampel…' : 'Prediksi kategori AI'}
              </button>
            </div>
          </div>
          {classificationError && (
            <div className="mx-5 mb-3 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 sm:mx-6">
              <AlertTriangle size={14} /> {classificationError}
            </div>
          )}
          <Table
            className="rounded-none border-0 shadow-none md:rounded-none"
            minWidth="min-w-[760px]"
            data={pageData}
            keyExtractor={(item) => item.id}
            emptyMessage="Belum ada sampel untuk ditampilkan."
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            paginationInfo={`Menampilkan ${data.stratifiedSample.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, data.stratifiedSample.length)} dari ${data.stratifiedSample.length} sampel`}
            columns={[
              {
                header: 'ID',
                headerClassName: 'w-[90px]',
                className: 'whitespace-nowrap font-mono text-xs text-[#667161]',
                cell: (item) => `#${item.id}`,
              },
              {
                header: 'Kategori',
                headerClassName: 'w-[190px]',
                className: 'whitespace-nowrap capitalize text-[#344235]',
                cell: (item) => categoryLabel(item.category || 'OTHER'),
              },
              {
                header: 'Prediksi AI',
                headerClassName: 'w-[220px]',
                className: 'whitespace-nowrap',
                cell: (item) => {
                  const prediction = predictions[String(item.id)];
                  return prediction ? (
                    <span className="inline-block whitespace-nowrap rounded-full bg-[#edf1e9] px-2.5 py-1 text-xs font-semibold capitalize text-[#38513b]">
                      {categoryLabel(prediction.predicted_category)}
                    </span>
                  ) : (
                    <span className="text-[#899286]">—</span>
                  );
                },
              },
              {
                header: 'Confidence',
                headerClassName: 'w-[140px]',
                className: 'whitespace-nowrap font-semibold text-[#53604f]',
                cell: (item) => {
                  const prediction = predictions[String(item.id)];
                  return prediction ? (
                    `${(prediction.confidence * 100).toFixed(1)}%`
                  ) : (
                    <span className="text-[#899286]">—</span>
                  );
                },
              },
              {
                header: 'Tanggal',
                headerClassName: 'w-[150px]',
                className: 'whitespace-nowrap text-xs text-[#667161]',
                cell: (item) =>
                  new Intl.DateTimeFormat('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date(item.date)),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
