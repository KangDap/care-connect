'use client';

import { useState } from 'react';

import { AIAnalysisClient } from './AIAnalysisClient';
import { AIInsightDashboard } from './AIInsightDashboard';

type AITab = 'apriori' | 'insight';

const tabs: { id: AITab; label: string }[] = [
  { id: 'apriori', label: 'Analisis Apriori' },
  { id: 'insight', label: 'AI Insight' },
];

export function AIAnalysisTabs() {
  const [activeTab, setActiveTab] = useState<AITab>('apriori');

  return (
    <div className="space-y-6">
      <div
        aria-label="Jenis analisis AI"
        className="flex w-fit flex-wrap gap-2 rounded-2xl border border-[#dce2d7] bg-white p-1.5"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`ai-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-[#193c1f] text-white shadow-sm'
                : 'text-[#687563] hover:bg-[#edf1e9] hover:text-[#193c1f]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section
        id={`ai-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`ai-tab-${activeTab}`}
      >
        {activeTab === 'apriori' ? (
          <AIAnalysisClient />
        ) : (
          <AIInsightDashboard />
        )}
      </section>
    </div>
  );
}
