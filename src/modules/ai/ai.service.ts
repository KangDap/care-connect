import { Errors } from '@/lib/error';

import { AIRepository } from './ai.repositories';
import {
  classifyInputSchema,
  statisticalAnalysisQuerySchema,
} from './ai.schema';
import type {
  CategoryStat,
  ClassifyInput,
  ClassifyInputItem,
  ClassifyResponseData,
  PeriodFilter,
  SectionStatisticalAnalysis,
  StatisticalAnalysisResponseData,
  StratifiedSampleItem,
} from './ai.type';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

type SectionItem = {
  id: string | number;
  title: string;
  description: string;
  category: string;
  createdAt?: Date;
  date?: Date;
};

function getCategoryBreakdown(items: SectionItem[]) {
  const categoryCounts = new Map<string, number>();
  const categoryItems = new Map<string, SectionItem[]>();

  for (const item of items) {
    const category = item.category || 'OTHER';
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    const itemsForCategory = categoryItems.get(category) ?? [];
    itemsForCategory.push(item);
    categoryItems.set(category, itemsForCategory);
  }

  const categoryBreakdown: CategoryStat[] = Array.from(categoryCounts).map(
    ([category, count]) => ({
      category,
      count,
      percentage: Number(((count / items.length) * 100).toFixed(1)),
    }),
  );
  categoryBreakdown.sort((first, second) => second.count - first.count);
  return { categoryBreakdown, categoryItems };
}

function getStratifiedSample(
  categoryBreakdown: CategoryStat[],
  categoryItems: Map<string, SectionItem[]>,
  totalCount: number,
  targetSampleSize: number,
): StratifiedSampleItem[] {
  const sample: StratifiedSampleItem[] = [];

  for (const stat of categoryBreakdown) {
    const stratumItems = categoryItems.get(stat.category) ?? [];
    const stratumCount = stratumItems.length;
    const stratumSampleSize = Math.max(
      1,
      Math.round((stratumCount / totalCount) * targetSampleSize),
    );
    const step = Math.max(1, Math.floor(stratumCount / stratumSampleSize));

    for (
      let index = 0;
      index < stratumCount && sample.length < targetSampleSize;
      index += step
    ) {
      const selected = stratumItems[index];
      if (!selected) continue;
      const itemDate = selected.createdAt || selected.date || new Date();
      sample.push({
        id: selected.id,
        category: selected.category,
        title: selected.title,
        description: selected.description,
        date: itemDate.toISOString(),
      });
    }
  }

  return sample;
}

function getSectionRecommendation(
  isReport: boolean,
  attentionRequired: boolean,
  categoryName: string,
  percentage: string,
): string {
  if (!attentionRequired) {
    return isReport
      ? 'Sebaran laporan relatif merata. Pertahankan sistem pemantauan berkala.'
      : 'Jadwal konsultasi berjalan seimbang antar kategori.';
  }

  if (isReport) {
    return `Perhatian Khusus: Kategori ${categoryName} mendominasi laporan (${percentage}). Disarankan meningkatkan tim investigasi dan koordinasi penanganan kasus pada kategori ini.`;
  }
  return `Perhatian Khusus: Topik ${categoryName} merupakan keluhan konsultasi tertinggi (${percentage}). Disarankan menambah alokasi jadwal psikolog spesialisasi ${categoryName}.`;
}

export class AIService {
  static async classify(input: ClassifyInput): Promise<ClassifyResponseData> {
    const validated = classifyInputSchema.parse(input);

    let itemsToClassify: ClassifyInputItem[] = validated.items
      ? [...validated.items]
      : [];

    if (validated.reportIds && validated.reportIds.length > 0) {
      const reports = await AIRepository.getReportsByIds(validated.reportIds);
      const reportItems = reports.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
      }));
      itemsToClassify = [...itemsToClassify, ...reportItems];
    }

    if (validated.consultationIds && validated.consultationIds.length > 0) {
      const consultations = await AIRepository.getConsultationsByIds(
        validated.consultationIds,
      );
      const consultItems = consultations.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
      }));
      itemsToClassify = [...itemsToClassify, ...consultItems];
    }

    if (validated.text && itemsToClassify.length === 0) {
      itemsToClassify.push({ text: validated.text });
    }

    if (itemsToClassify.length === 0) {
      const recentReports = await AIRepository.getRecentReports(10);
      itemsToClassify = recentReports.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
      }));
    }

    const aiResponse = await fetch(
      `${AI_SERVICE_URL}/dashboard/admin/ai/classify`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: validated.text,
          items: itemsToClassify,
        }),
      },
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      let message = errorText;
      try {
        const json = JSON.parse(errorText);
        message = json.detail || json.message || errorText;
      } catch {
        // Not valid JSON
      }
      throw Errors.unprocessable(`AI Classification failed: ${message}`);
    }

    const data: ClassifyResponseData = await aiResponse.json();
    return data;
  }

  private static calculateStartDate(period: PeriodFilter): Date | null {
    const now = new Date();
    switch (period) {
      case '1w':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1m':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3m':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '6m':
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case 'all':
      default:
        return null;
    }
  }

  private static analyzeSectionData(
    items: SectionItem[],
    targetSampleSize: number,
    sectionType: 'report' | 'consultation',
  ): SectionStatisticalAnalysis {
    const totalCount = items.length;

    if (totalCount === 0) {
      const sectionLabel = sectionType === 'report' ? 'laporan' : 'konsultasi';
      return {
        totalCount: 0,
        dominantCategory: null,
        mode: null,
        categoryBreakdown: [],
        stratifiedSample: [],
        sampleSize: 0,
        insights: {
          summary: `Tidak ada data ${sectionLabel} pada periode ini.`,
          priorityCategories: [],
          recommendation: `Belum ada tindakan khusus yang diperlukan karena tidak ada data ${sectionLabel}.`,
        },
      };
    }

    const { categoryBreakdown, categoryItems } = getCategoryBreakdown(items);

    const dominant = categoryBreakdown[0];
    const dominantCategory = dominant
      ? {
          category: dominant.category,
          count: dominant.count,
          percentage: dominant.percentage,
          attentionRequired: dominant.percentage >= 30 || dominant.count >= 3,
        }
      : null;

    const stratifiedSample = getStratifiedSample(
      categoryBreakdown,
      categoryItems,
      totalCount,
      targetSampleSize,
    );

    const priorityCategories = categoryBreakdown
      .slice(0, 2)
      .map((c) => c.category);
    const topCatName = dominantCategory ? dominantCategory.category : 'N/A';
    const topPct = dominantCategory ? `${dominantCategory.percentage}%` : '0%';

    const isReport = sectionType === 'report';
    const summary = isReport
      ? `Terdaftar total ${totalCount} laporan. Kategori yang paling banyak dilaporkan adalah ${topCatName} (${topPct}).`
      : `Terdaftar total ${totalCount} sesi konsultasi. Kategori topik konsultasi terbanyak adalah ${topCatName} (${topPct}).`;

    const recommendation = getSectionRecommendation(
      isReport,
      Boolean(dominantCategory?.attentionRequired),
      topCatName,
      topPct,
    );

    return {
      totalCount,
      dominantCategory,
      mode: dominantCategory,
      categoryBreakdown,
      stratifiedSample,
      sampleSize: stratifiedSample.length,
      insights: {
        summary,
        priorityCategories,
        recommendation,
      },
    };
  }

  static async getStatisticalAnalysis(params: {
    period?: PeriodFilter;
    sampleSize?: number;
  }): Promise<StatisticalAnalysisResponseData> {
    const validated = statisticalAnalysisQuerySchema.parse(params);
    const startDate = this.calculateStartDate(validated.period);
    const endDate = new Date().toISOString();

    const [reportsData, consultationsData] = await Promise.all([
      AIRepository.getReportsByStartDate(startDate),
      AIRepository.getConsultationsByStartDate(startDate),
    ]);

    const reportsAnalysis = this.analyzeSectionData(
      reportsData,
      validated.sampleSize,
      'report',
    );

    const consultationsAnalysis = this.analyzeSectionData(
      consultationsData,
      validated.sampleSize,
      'consultation',
    );

    return {
      period: validated.period,
      startDate: startDate ? startDate.toISOString() : null,
      endDate,
      reports: reportsAnalysis,
      consultations: consultationsAnalysis,
    };
  }
}
