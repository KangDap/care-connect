'use client';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Table } from '@/components/table';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import type { CategoryInsights, Itemset, Rule } from '@/types/ai-analysis';
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Clock3,
  Database,
  Gauge,
  Network,
  Play,
  RotateCcw,
  Sparkles,
  Tags,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { ElementType, ReactNode } from 'react';

const formatDuration = (durationMs: number) =>
  durationMs >= 1000
    ? `${(durationMs / 1000).toFixed(2)}s`
    : `${durationMs.toFixed(0)}ms`;

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const topItems = <T,>(items: T[] | undefined, limit = 8) =>
  [...(items ?? [])].slice(0, limit);

function MetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon size={19} strokeWidth={2.4} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-wider text-[#8EA087]">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-black text-[#193C1F] sm:text-2xl">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ItemsetList({ itemsets }: { itemsets: Itemset[] }) {
  if (itemsets.length === 0) {
    return (
      <div className="py-10 text-center text-sm font-medium text-[#8EA087]">
        No frequent itemsets returned yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#F7F3ED]">
      {itemsets.map((item, index) => (
        <div
          key={`${item.itemsets.join('-')}-${index}`}
          className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 flex-wrap gap-2">
            {item.itemsets.map((label) => (
              <span
                key={label}
                className="rounded-full border border-[#D0D5CB] bg-[#F7F3ED] px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#193C1F]"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="min-w-[160px]">
            <div className="mb-1 flex justify-between text-[11px] font-black text-[#8EA087]">
              <span>Support</span>
              <span>{formatPercent(item.support)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#F7F3ED]">
              <div
                className="h-full rounded-full bg-[#8EA087]"
                style={{ width: `${Math.min(item.support * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RuleList({ rules }: { rules: Rule[] }) {
  return (
    <Table
      className="shadow-none border-0 rounded-t-none md:rounded-t-none"
      minWidth="min-w-[760px]"
      data={rules}
      keyExtractor={(row) =>
        row.antecedents.join('-') + '->' + row.consequents.join('-')
      }
      emptyMessage="No association rules returned yet."
      columns={[
        {
          header: 'If',
          cell: (row) => <TagGroup items={row.antecedents} />,
        },
        {
          header: 'Then',
          cell: (row) => <TagGroup items={row.consequents} />,
        },
        {
          header: 'Confidence',
          cell: (row) => (
            <p className="font-black text-[#193C1F]">
              {formatPercent(row.confidence)}
            </p>
          ),
        },
        {
          header: 'Lift',
          cell: (row) => (
            <p className="font-black text-[#193C1F]">{row.lift.toFixed(2)}</p>
          ),
        },
        {
          header: 'Support',
          cell: (row) => (
            <p className="font-bold text-[#8EA087]">
              {formatPercent(row.support)}
            </p>
          ),
        },
      ]}
    />
  );
}

function TagGroup({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-lg bg-[#F7F3ED] px-2.5 py-1 text-[11px] font-bold text-[#193C1F]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CategoryPanel({
  category,
  insights,
}: {
  category: string;
  insights: CategoryInsights;
}) {
  const categoryItemsets = Array.isArray(insights)
    ? insights
    : (insights.frequent_itemsets ?? []);
  const categoryRules = Array.isArray(insights)
    ? []
    : (insights.association_rules ?? []);
  const firstRule = categoryRules[0];

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#8EA087]">
            Category
          </p>
          <h3 className="mt-1 text-lg font-black text-[#193C1F]">{category}</h3>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-black text-[#8EA087]">
          <Tags size={14} />
          {categoryItemsets.length} itemsets
        </div>
      </div>

      {firstRule ? (
        <div className="rounded-2xl border border-[#D0D5CB]/50 bg-[#FDFCFB] p-4">
          <p className="mb-3 text-[11px] font-black uppercase tracking-widest text-[#8EA087]">
            Strongest Rule
          </p>
          <div className="space-y-3">
            <TagGroup items={firstRule.antecedents} />
            <div className="text-xs font-black uppercase tracking-widest text-[#8EA087]">
              predicts
            </div>
            <TagGroup items={firstRule.consequents} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <MiniMetric
              label="Conf."
              value={formatPercent(firstRule.confidence)}
            />
            <MiniMetric label="Lift" value={firstRule.lift.toFixed(2)} />
            <MiniMetric label="Rules" value={categoryRules.length} />
          </div>
        </div>
      ) : categoryItemsets.length > 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D0D5CB] px-4 py-6">
          <p className="mb-3 text-center text-[11px] font-black uppercase tracking-widest text-[#8EA087]">
            Top Itemsets
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {topItems(categoryItemsets, 5).map((itemset, index) => (
              <span
                key={`${category}-${itemset.itemsets.join('-')}-${index}`}
                className="rounded-full bg-[#F7F3ED] px-3 py-1 text-[11px] font-bold text-[#193C1F]"
              >
                {itemset.itemsets.join(', ')}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#D0D5CB] px-4 py-6">
          <p className="text-center text-sm font-medium text-[#8EA087]">
            No association rules or itemsets found for this category.
          </p>
        </div>
      )}
    </Card>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-[#F7F3ED] px-2 py-2">
      <p className="text-[9px] font-black uppercase tracking-wider text-[#8EA087]">
        {label}
      </p>
      <p className="text-sm font-black text-[#193C1F]">{value}</p>
    </div>
  );
}

type AIAnalysisClientProps = {
  badgeLabel?: string;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  canRunAnalysis?: boolean;
  unavailableNotice?: ReactNode;
};

export function AIAnalysisClient({
  badgeLabel = 'Admin AI',
  title = 'AI Pattern Analysis',
  description = 'Run association analysis on incident reports and surface patterns that can guide moderation, outreach, and support planning.',
  emptyTitle = 'Ready to analyze report patterns',
  emptyDescription = 'Click run analysis to ask the backend AI service for frequent itemsets, association rules, and category-level insights.',
  canRunAnalysis = true,
  unavailableNotice,
}: AIAnalysisClientProps) {
  const searchParams = useSearchParams();
  const searchQuery = (searchParams.get('search') || '').trim().toLowerCase();
  const { data, loading, error, analyze, reset } = useAIAnalysis();
  const matchesSearch = (values: Array<number | string | undefined>) =>
    !searchQuery ||
    values.some((value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(searchQuery),
    );

  const globalItemsets = topItems(
    data?.api_payload.global.frequent_itemsets,
    10,
  ).filter((item) =>
    matchesSearch([...item.itemsets, formatPercent(item.support)]),
  );
  const globalRules = topItems(
    data?.api_payload.global.association_rules,
    10,
  ).filter((rule) =>
    matchesSearch([
      ...rule.antecedents,
      ...rule.consequents,
      formatPercent(rule.confidence),
      formatPercent(rule.support),
      rule.lift.toFixed(2),
    ]),
  );
  const categoryEntries = Object.entries(
    data?.api_payload.by_category ?? {},
  ).filter(([category, insights]) => {
    if (!searchQuery) return true;

    const itemsets = Array.isArray(insights)
      ? insights
      : (insights.frequent_itemsets ?? []);
    const rules = Array.isArray(insights)
      ? []
      : (insights.association_rules ?? []);

    return (
      matchesSearch([category]) ||
      itemsets.some((item) =>
        matchesSearch([...item.itemsets, formatPercent(item.support)]),
      ) ||
      rules.some((rule) =>
        matchesSearch([
          ...rule.antecedents,
          ...rule.consequents,
          formatPercent(rule.confidence),
          formatPercent(rule.support),
          rule.lift.toFixed(2),
        ]),
      )
    );
  });

  const handleAnalyze = async () => {
    if (!canRunAnalysis) return;

    try {
      await analyze({ reports: [], text_columns: ['title', 'description'] });
    } catch {
      // Error state is handled by the hook.
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D0D5CB] bg-white px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#8EA087]">
            <Sparkles size={14} />
            {badgeLabel}
          </div>
          <h1 className="text-2xl font-black leading-tight text-[#193C1F] md:text-[32px]">
            {title}
          </h1>
          <p className="mt-1 max-w-3xl text-sm font-medium text-[#8EA087] md:text-base">
            {description}
          </p>
        </div>
        {canRunAnalysis && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleAnalyze}
              loading={loading}
              disabled={loading}
              className="rounded-xl px-4 py-3 text-sm"
            >
              <Play size={16} />
              Run Analysis
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              disabled={loading || !data}
              className="rounded-xl px-4 py-3 text-sm"
            >
              <RotateCcw size={16} />
              Reset
            </Button>
          </div>
        )}
      </div>

      {!canRunAnalysis && unavailableNotice}

      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex gap-3 text-red-700">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-black">
                AI service could not complete analysis.
              </p>
              <p className="mt-1 text-sm font-medium">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {!data && !loading && (
        <Card className="p-8 md:p-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#193C1F] text-white">
              <BrainCircuit size={30} />
            </div>
            <h2 className="text-xl font-black text-[#193C1F]">{emptyTitle}</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#8EA087]">
              {emptyDescription}
            </p>
          </div>
        </Card>
      )}

      {loading && (
        <Card className="p-8 md:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-[#D0D5CB] border-t-[#193C1F]" />
            <h2 className="text-lg font-black text-[#193C1F]">
              Running AI analysis
            </h2>
            <p className="mt-2 text-sm font-medium text-[#8EA087]">
              Processing reports through the FastAPI AI service.
            </p>
          </div>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <MetricCard
              icon={Database}
              label="Processed"
              value={data.processed_count}
              tone="bg-[#F7F3ED] text-[#193C1F]"
            />
            <MetricCard
              icon={Network}
              label="Transactions"
              value={data.transaction_count}
              tone="bg-blue-50 text-blue-700"
            />
            <MetricCard
              icon={Tags}
              label="Itemsets"
              value={data.frequent_itemsets_count}
              tone="bg-amber-50 text-amber-700"
            />
            <MetricCard
              icon={Gauge}
              label="Rules"
              value={data.rules_count}
              tone="bg-green-50 text-green-700"
            />
            <MetricCard
              icon={Clock3}
              label="Duration"
              value={formatDuration(data.duration_ms)}
              tone="bg-slate-100 text-slate-700"
            />
          </div>

          {data.warnings && data.warnings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3 text-amber-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-black">Analysis warnings</p>
                  <ul className="mt-2 space-y-1 text-sm font-medium">
                    {data.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="p-0">
              <div className="border-b border-[#F7F3ED] bg-[#FDFCFB] p-5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-[#193C1F]" />
                  <h2 className="font-black text-[#193C1F]">
                    Global Frequent Itemsets
                  </h2>
                </div>
                <p className="mt-1 text-xs font-medium text-[#8EA087]">
                  Most common grouped patterns across analyzed reports.
                </p>
              </div>
              <ItemsetList itemsets={globalItemsets} />
            </Card>

            <Card className="p-0">
              <div className="border-b border-[#F7F3ED] bg-[#FDFCFB] p-5">
                <div className="flex items-center gap-2">
                  <Network size={18} className="text-[#193C1F]" />
                  <h2 className="font-black text-[#193C1F]">
                    Global Association Rules
                  </h2>
                </div>
                <p className="mt-1 text-xs font-medium text-[#8EA087]">
                  Top relationships ranked as returned by the AI service.
                </p>
              </div>
              <RuleList rules={globalRules} />
            </Card>
          </div>

          {categoryEntries.length > 0 && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-black text-[#193C1F]">
                  Category Insights
                </h2>
                <p className="text-sm font-medium text-[#8EA087]">
                  Strongest rules and itemset counts grouped by report category.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {categoryEntries.map(([category, insights]) => (
                  <CategoryPanel
                    key={category}
                    category={category}
                    insights={insights}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
