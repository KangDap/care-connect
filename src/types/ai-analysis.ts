export interface ReportInput {
  report_id: string | number;
  title: string;
  description: string;
  category?: string;
  province?: string;
  city?: string;
  district?: string;
  incident_date?: string;
}

export interface AnalyzeRequest {
  reports?: ReportInput[];
  text_columns?: string[];
}

export interface Itemset {
  itemsets: string[];
  support: number;
}

export interface Rule {
  antecedents: string[];
  consequents: string[];
  support: number;
  confidence: number;
  lift: number;
}

export type CategoryInsights =
  | Itemset[]
  | {
      frequent_itemsets?: Itemset[];
      association_rules?: Rule[];
    };

export interface ApiPayload {
  global: {
    frequent_itemsets: Itemset[];
    association_rules: Rule[];
  };
  by_category: Record<string, CategoryInsights>;
}

export interface AnalyzeResponse {
  status: string;
  processed_count: number;
  transaction_count: number;
  frequent_itemsets_count: number;
  rules_count: number;
  duration_ms: number;
  api_payload: ApiPayload;
  warnings?: string[];
}

export interface AnalyzeAPIResponse {
  success: boolean;
  data?: AnalyzeResponse;
  error?: string;
}
