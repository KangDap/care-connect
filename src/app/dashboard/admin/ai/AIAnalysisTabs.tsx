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
    <div className="space-y-6 md:space-y-8">
      <div
        aria-label="Jenis analisis AI"
        className="flex w-fit flex-wrap gap-1 rounded-2xl border border-[#d0d5cb] bg-white p-1.5 shadow-sm"
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
            className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] transition-all ${
              activeTab === tab.id
                ? 'bg-[#193c1f] text-[#f7f3ed] shadow-sm'
                : 'text-[#8ea087] hover:bg-[#f7f3ed] hover:text-[#193c1f]'
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
