'use client';

import { analyzeReports } from '@/lib/api/ai-analysis';
import type { AnalyzeRequest, AnalyzeResponse } from '@/types/ai-analysis';
import { useCallback, useState } from 'react';

interface UseAIAnalysisState {
  data: AnalyzeResponse | null;
  loading: boolean;
  error: string | null;
}

interface UseAIAnalysisActions {
  analyze: (request?: AnalyzeRequest) => Promise<void>;
  reset: () => void;
}

/**
 * React hook for AI analysis
 * Handles loading, error, and success states
 *
 * @example
 * const { data, loading, error, analyze } = useAIAnalysis();
 *
 * const handleClick = async () => {
 *   await analyze({});  // Auto-fetch from Supabase
 * };
 */
export function useAIAnalysis(): UseAIAnalysisState & UseAIAnalysisActions {
  const [state, setState] = useState<UseAIAnalysisState>({
    data: null,
    loading: false,
    error: null,
  });

  const analyze = useCallback(async (request: AnalyzeRequest = {}) => {
    setState({ data: null, loading: true, error: null });

    try {
      const result = await analyzeReports(request);
      setState({ data: result, loading: false, error: null });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'object' &&
              err !== null &&
              'message' in err &&
              typeof err.message === 'string'
            ? err.message
            : 'An unknown error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    analyze,
    reset,
  };
}
