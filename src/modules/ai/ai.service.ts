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
    items: Array<{
      id: string | number;
      title: string;
      description: string;
      category: string;
      createdAt?: Date;
      date?: Date;
    }>,
    targetSampleSize: number,
    sectionType: 'report' | 'consultation',
  ): SectionStatisticalAnalysis {
    const totalCount = items.length;

    if (totalCount === 0) {
      return {
        totalCount: 0,
        dominantCategory: null,
        mode: null,
        categoryBreakdown: [],
        stratifiedSample: [],
        sampleSize: 0,
        insights: {
          summary: `Tidak ada data ${sectionType === 'report' ? 'laporan' : 'konsultasi'} pada periode ini.`,
          priorityCategories: [],
          recommendation: `Belum ada tindakan khusus yang diperlukan karena tidak ada data ${sectionType === 'report' ? 'laporan' : 'konsultasi'}.`,
        },
      };
    }

    const categoryCounts: Record<string, number> = {};
    const categoryItemsMap: Record<string, typeof items> = {};

    for (const item of items) {
      const cat = item.category || 'OTHER';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      if (!categoryItemsMap[cat]) categoryItemsMap[cat] = [];
      categoryItemsMap[cat].push(item);
    }

    const categoryBreakdown: CategoryStat[] = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Number(((count / totalCount) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    const dominant = categoryBreakdown[0];
    const dominantCategory = dominant
      ? {
          category: dominant.category,
          count: dominant.count,
          percentage: dominant.percentage,
          attentionRequired: dominant.percentage >= 30 || dominant.count >= 3,
        }
      : null;

    const stratifiedSample: StratifiedSampleItem[] = [];

    for (const stat of categoryBreakdown) {
      const stratumItems = categoryItemsMap[stat.category] || [];
      const stratumCount = stratumItems.length;

      const proportion = stratumCount / totalCount;
      const stratumSampleSize = Math.max(
        1,
        Math.round(proportion * targetSampleSize),
      );

      const step = Math.max(1, Math.floor(stratumCount / stratumSampleSize));
      for (
        let i = 0;
        i < stratumCount && stratifiedSample.length < targetSampleSize;
        i += step
      ) {
        const selected = stratumItems[i];
        if (selected) {
          const itemDate = selected.createdAt || selected.date || new Date();
          stratifiedSample.push({
            id: selected.id,
            category: selected.category,
            title: selected.title,
            description: selected.description,
            date: itemDate.toISOString(),
          });
        }
        if (stratifiedSample.length >= targetSampleSize) break;
      }
    }

    const priorityCategories = categoryBreakdown
      .slice(0, 2)
      .map((c) => c.category);
    const topCatName = dominantCategory ? dominantCategory.category : 'N/A';
    const topPct = dominantCategory ? `${dominantCategory.percentage}%` : '0%';

    const isReport = sectionType === 'report';
    const summary = isReport
      ? `Terdaftar total ${totalCount} laporan. Kategori yang paling banyak dilaporkan adalah ${topCatName} (${topPct}).`
      : `Terdaftar total ${totalCount} sesi konsultasi. Kategori topik konsultasi terbanyak adalah ${topCatName} (${topPct}).`;

    const recommendation = isReport
      ? dominantCategory?.attentionRequired
        ? `Perhatian Khusus: Kategori ${topCatName} mendominasi laporan (${topPct}). Disarankan meningkatkan tim investigasi dan koordinasi penanganan kasus pada kategori ini.`
        : `Sebaran laporan relatif merata. Pertahankan sistem pemantauan berkala.`
      : dominantCategory?.attentionRequired
        ? `Perhatian Khusus: Topik ${topCatName} merupakan keluhan konsultasi tertinggi (${topPct}). Disarankan menambah alokasi jadwal psikolog spesialisasi ${topCatName}.`
        : `Jadwal konsultasi berjalan seimbang antar kategori.`;

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
