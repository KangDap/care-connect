import { auth } from '@/lib/auth/auth';
import { ApiError, Errors } from '@/lib/error';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Get AI Service URL from environment
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

interface AnalyzeRequestBody {
  reports?: Array<{
    report_id: string | number;
    title: string;
    description: string;
    category?: string;
    province?: string;
    city?: string;
    district?: string;
    incident_date?: string;
  }>;
  text_columns?: string[];
}

interface AnalyzeResponse {
  status: string;
  processed_count: number;
  transaction_count: number;
  frequent_itemsets_count: number;
  rules_count: number;
  duration_ms: number;
  api_payload: Record<string, unknown>;
  warnings?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      throw Errors.unauthorized('Authentication required');
    }

    if (session.user.role !== 'ADMIN') {
      throw Errors.forbidden('Admin role required to access AI analysis');
    }

    // Parse request body
    let body: AnalyzeRequestBody = {};
    try {
      body = await req.json();
    } catch {
      // Allow empty body (will trigger auto-fetch from Supabase)
      body = {};
    }

    console.log(`[AI Analyze] Admin ${session.user.id} triggered analysis`);

    // Forward request to FastAPI service
    const aiResponse = await fetch(
      `${AI_SERVICE_URL}/dashboard/admin/ai/analyze`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reports: body.reports || [],
          text_columns: body.text_columns || ['title', 'description'],
        }),
      },
    );

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text();
      console.error(
        `[AI Analyze] FastAPI error: ${aiResponse.status} - ${errorData}`,
      );

      let parsedError = errorData;
      try {
        const json = JSON.parse(errorData);
        parsedError = json.detail || json.message || errorData;
      } catch {
        // Not valid JSON, keep the original text
      }

      throw new Error(
        `AI Service returned ${aiResponse.status}: ${parsedError || 'Unknown error'}`,
      );
    }

    const analysisResult: AnalyzeResponse = await aiResponse.json();

    console.log(
      `[AI Analyze] Success: processed=${analysisResult.processed_count}, ` +
        `transactions=${analysisResult.transaction_count}, ` +
        `duration=${analysisResult.duration_ms.toFixed(2)}ms`,
    );

    return NextResponse.json({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      console.warn(`[AI Analyze] API Error: ${error.message}`);
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    console.error('[AI Analyze] Error:', errorMessage);

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
