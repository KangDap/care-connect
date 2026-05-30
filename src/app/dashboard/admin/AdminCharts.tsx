'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DonationChartData = { date: string; total: number; count: number };
type StatusChartData = { status: string; count: number };

export function DonationLineChart({ data }: { data: DonationChartData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full bg-transparent" />;
  }

  return (
    <div className="w-full h-full min-w-0">
      <ResponsiveContainer width="99%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#D0D5CB" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8EA087' }} />
          <YAxis
            tick={{ fontSize: 11, fill: '#8EA087' }}
            tickFormatter={(v) =>
              v >= 1_000_000
                ? `${(v / 1_000_000).toFixed(1)}M`
                : v >= 1000
                  ? `${(v / 1000).toFixed(0)}K`
                  : String(v)
            }
          />
          <Tooltip
            formatter={(value) => {
              if (typeof value !== 'number') {
                return String(value ?? '');
              }

              return new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(value);
            }}
            contentStyle={{
              background: '#fff',
              border: '1px solid #D0D5CB',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#8EA087"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#8EA087' }}
            activeDot={{ r: 6 }}
            name="Total Amount"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReportsBarChart({ data }: { data: StatusChartData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full bg-transparent" />;
  }

  return (
    <div className="w-full h-full min-w-0">
      <ResponsiveContainer width="99%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#D0D5CB" />
          <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#8EA087' }} />
          <YAxis tick={{ fontSize: 11, fill: '#8EA087' }} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #D0D5CB',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="count"
            fill="#193C1F"
            radius={[4, 4, 0, 0]}
            name="Reports"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConsultationsBarChart({ data }: { data: StatusChartData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handle = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(handle);
  }, []);

  if (!mounted) {
    return <div className="h-full w-full bg-transparent" />;
  }

  return (
    <div className="w-full h-full min-w-0">
      <ResponsiveContainer width="99%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#D0D5CB" />
          <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#8EA087' }} />
          <YAxis tick={{ fontSize: 11, fill: '#8EA087' }} />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: '1px solid #D0D5CB',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="count"
            fill="#D1B698"
            radius={[4, 4, 0, 0]}
            name="Consultations"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Alias used in admin page for consultations chart
export { ConsultationsBarChart as ConsultationLineChart };
