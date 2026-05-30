'use client';

import { Button } from '@/components/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';

import { DonationForm } from '../../DonationForm';

type ReportInfo = {
  id: number;
  title: string;
  category: string;
  province: string;
  city: string;
  status?: string;
  incidentDate?: string;
  description: string;
};

type Props = {
  params: Promise<{ reportId: string }>;
};

export default function DonationReportPage({ params }: Props) {
  const { reportId } = use(params);
  const [report, setReport] = useState<ReportInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/report/${reportId}`)
      .then((r) => r.json())
      .then((result) => {
        if (result?.success && result?.data) {
          const d = result.data;
          setReport({
            id: d.id,
            title: d.title,
            category: d.category,
            province: d.province,
            city: d.city,
            status: d.status,
            incidentDate: d.incidentDate
              ? new Date(d.incidentDate).toISOString()
              : undefined,
            description: d.description,
          });
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3ed]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#193c1f] mb-4" />
          <p className="text-[#8ea087] font-medium">
            Loading report details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f3ed]">
        <div className="text-center">
          <p className="text-red-600 font-bold mb-4">
            Failed to load report details.
          </p>
          <Link
            href="/donation/report"
            className="inline-flex items-center gap-3 text-[#8ea087] font-bold hover:underline"
          >
            <Button
              type="button"
              variant="outline"
              className="icon-button back-icon-button h-11 w-11 rounded-full p-0"
              aria-label="Back to Report List"
            >
              <ArrowLeft size={18} />
            </Button>
            Back to Report List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DonationForm
      donationType="REPORT"
      report={report}
      backHref="/donation/report"
    />
  );
}
