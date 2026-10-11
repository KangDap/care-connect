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
  Sparkles,
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
  title,
  type,
  data,
  onExport,
}: {
  title: string;
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
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#edf1e9] p-2.5 text-[#34563a]">
              <Sparkles size={19} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#74816f]">
                Ringkasan AI · {title}
              </p>
              <p className="mt-1 text-sm text-[#899286]">
                Prioritas berdasarkan kategori paling sering muncul
              </p>
            </div>
          </div>
          {data.dominantCategory && (
            <span className="rounded-full bg-[#f4eadc] px-3 py-1.5 text-xs font-bold capitalize text-[#86603a]">
              {data.dominantCategory.attentionRequired
                ? 'Perlu perhatian'
                : 'Sebaran merata'}
            </span>
          )}
        </div>
        <div className="mt-5 space-y-3">
          <p className="rounded-xl bg-[#f7f8f5] p-4 text-sm font-semibold leading-6 text-[#344235]">
            {data.insights.summary}
          </p>
          <div className="border-l-[3px] border-[#8ea087] pl-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#74816f]">
              Rekomendasi tindak lanjut
            </p>
            <p className="mt-1 text-sm leading-6 text-[#53604f]">
              {data.insights.recommendation}
            </p>
          </div>
        </div>
        {data.insights.priorityCategories.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold text-[#74816f]">
              Fokus:
            </span>
            {data.insights.priorityCategories.map((category) => (
              <span
                key={category}
                className="rounded-full border border-[#dce2d7] px-3 py-1 text-xs font-semibold capitalize text-[#38513b]"
              >
                {categoryLabel(category)}
              </span>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#193c1f]">Sebaran kategori</h3>
              <p className="mt-1 text-xs text-[#899286]">
                Jumlah dan persentase dari{' '}
                {numberFormat.format(data.totalCount)}{' '}
                {type.toLocaleLowerCase('id-ID')}
              </p>
            </div>
            <span className="rounded-lg bg-[#f7f8f5] px-2.5 py-1.5 text-xs font-semibold text-[#687563]">
              {data.categoryBreakdown.length} kategori
            </span>
          </div>
          {data.categoryBreakdown.length ? (
            <div className="mt-6 space-y-4">
              {data.categoryBreakdown.map((item) => (
                <div key={item.category}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium capitalize text-[#344235]">
                      {categoryLabel(item.category)}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[#74816f]">
                      {numberFormat.format(item.count)} · {item.percentage}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#eef0eb]">
                    <div
                      className="h-full rounded-full bg-[#68836a]"
                      style={{
                        width: `${Math.max(2, (item.count / maxCount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-xl bg-[#f7f8f5] px-4 py-8 text-center text-sm text-[#899286]">
              Belum ada data kategori pada periode ini.
            </p>
          )}
        </Card>

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
