export interface ClassifyInputItem {
  id?: string | number;
  text?: string;
  title?: string;
  description?: string;
}

export interface ClassifyInput {
  text?: string;
  items?: ClassifyInputItem[];
  reportIds?: (string | number)[];
  consultationIds?: (string | number)[];
}

export interface ClassifyResultItem {
  id?: string | number;
  text: string;
  predicted_category: string;
  confidence: number;
  probabilities: Record<string, number>;
}

export interface ClassifyResponseData {
  status: string;
  processed_count: number;
  duration_ms: number;
  results: ClassifyResultItem[];
}

export interface ClassifyAPIResponse {
  success: boolean;
  data?: ClassifyResponseData;
  error?: string;
}

export type PeriodFilter = '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface StratifiedSampleItem {
  id: string | number;
  category: string;
  title: string;
  description: string;
  date: string;
}

export interface SectionStatisticalAnalysis {
  totalCount: number;
  dominantCategory: {
    category: string;
    count: number;
    percentage: number;
    attentionRequired: boolean;
  } | null;
  mode: {
    category: string;
    count: number;
    percentage: number;
    attentionRequired: boolean;
  } | null;
  categoryBreakdown: CategoryStat[];
  stratifiedSample: StratifiedSampleItem[];
  sampleSize: number;
  insights: {
    summary: string;
    priorityCategories: string[];
    recommendation: string;
  };
}

export interface StatisticalAnalysisResponseData {
  period: PeriodFilter;
  startDate: string | null;
  endDate: string;
  reports: SectionStatisticalAnalysis;
  consultations: SectionStatisticalAnalysis;
}

export interface StatisticalAnalysisAPIResponse {
  success: boolean;
  data?: StatisticalAnalysisResponseData;
  error?: string;
}
