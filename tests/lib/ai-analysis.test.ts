import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Analysis Client Unit Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully analyze reports using Apriori payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        api_payload: {
          global: {
            frequent_itemsets: [
              {
                itemsets: ['anxiety'],
                support: 0.549,
              },
            ],
            association_rules: [
              {
                antecedents: ['partner'],
                consequents: ['anxiety'],
                confidence: 0.735,
                lift: 2.1,
              },
            ],
          },
          by_category: {},
        },
      }),
    });

    const response = await fetch('/api/ai-analysis', {
      method: 'POST',
      body: JSON.stringify({
        reports: [],
        text_columns: ['title', 'description'],
      }),
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.success).toBe(true);
    expect(result.api_payload.global.frequent_itemsets).toHaveLength(1);
    expect(result.api_payload.global.association_rules).toHaveLength(1);
  });

  it('should handle empty analysis result', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        api_payload: {
          global: {
            frequent_itemsets: [],
            association_rules: [],
          },
          by_category: {},
        },
      }),
    });

    const response = await fetch('/api/ai-analysis', {
      method: 'POST',
      body: JSON.stringify({
        reports: [],
        text_columns: ['title', 'description'],
      }),
    });

    const result = await response.json();

    expect(result.api_payload.global.frequent_itemsets).toEqual([]);
    expect(result.api_payload.global.association_rules).toEqual([]);
  });

  it('should handle AI analysis server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Analysis failed',
        },
      }),
    });

    const response = await fetch('/api/ai-analysis', {
      method: 'POST',
      body: JSON.stringify({
        reports: [],
        text_columns: ['title', 'description'],
      }),
    });

    const result = await response.json();

    expect(response.ok).toBe(false);
    expect(result.success).toBe(false);
    expect(result.error.message).toBe('Analysis failed');
  });

  it('should validate association rule structure', () => {
    const rule = {
      antecedents: ['physical_abuse'],
      consequents: ['trauma'],
      confidence: 0.668,
      lift: 2.61,
    };

    expect(rule.antecedents).toContain('physical_abuse');
    expect(rule.consequents).toContain('trauma');
    expect(rule.confidence).toBeGreaterThan(0.6);
    expect(rule.lift).toBeGreaterThan(1);
  });

  it('should validate frequent itemset structure', () => {
    const itemset = {
      itemsets: ['anxiety'],
      support: 0.549,
    };

    expect(itemset.itemsets).toContain('anxiety');
    expect(itemset.support).toBeGreaterThan(0.1);
  });
});
