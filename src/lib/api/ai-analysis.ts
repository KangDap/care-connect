/**
 * AI Analysis API client
 * Wrapper for calling the AI analysis endpoint from Next.js
 */
import type {
  AnalyzeAPIResponse,
  AnalyzeRequest,
  AnalyzeResponse,
} from '@/types/ai-analysis';

interface AIAnalysisError {
  status: number;
  message: string;
}

function isAIAnalysisError(e: unknown): e is AIAnalysisError {
  if (typeof e !== 'object' || e === null) return false;
  const r = e as Record<string, unknown>;
  return (
    'status' in r &&
    typeof r.status === 'number' &&
    'message' in r &&
    typeof r.message === 'string'
  );
}

/**
 * Call the AI analysis endpoint
 * @param request - Optional request body with reports and parameters
 * @returns Promise with analysis results
 * @throws AIAnalysisError on failure
 */
export async function analyzeReports(
  request: AnalyzeRequest = {},
): Promise<AnalyzeResponse> {
  try {
    const response = await fetch('/api/dashboard/admin/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data: AnalyzeAPIResponse = await response.json();

    if (!response.ok) {
      const error: AIAnalysisError = {
        status: response.status,
        message: data.error || 'Analysis failed',
      };
      throw error;
    }

    if (!data.success || !data.data) {
      throw {
        status: response.status,
        message: 'Invalid response from server',
      } as AIAnalysisError;
    }

    return data.data;
  } catch (error) {
    if (isAIAnalysisError(error)) {
      throw error;
    }

    if (error instanceof Error) {
      throw {
        status: 500,
        message: error.message,
      } as AIAnalysisError;
    }

    throw {
      status: 500,
      message: 'Unknown error',
    } as AIAnalysisError;
  }
}

/**
 * Fetch reports and run analysis (auto-fetch from Supabase)
 * @returns Promise with analysis results
 */
export async function analyzeAllReports(): Promise<AnalyzeResponse> {
  return analyzeReports({});
}

/**
 * Analyze specific reports
 * @param reports - Array of report objects to analyze
 * @param textColumns - Which columns to use for text analysis (default: ["title", "description"])
 * @returns Promise with analysis results
 */
export async function analyzeSpecificReports(
  reports: AnalyzeRequest['reports'],
  textColumns: string[] = ['title', 'description'],
): Promise<AnalyzeResponse> {
  return analyzeReports({
    reports,
    text_columns: textColumns,
  });
}
