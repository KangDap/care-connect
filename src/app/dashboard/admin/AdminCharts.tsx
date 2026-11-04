'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type StatusChartData = { status: string; count: number };

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
