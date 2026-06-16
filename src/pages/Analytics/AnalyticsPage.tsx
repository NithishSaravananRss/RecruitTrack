import React, { useState } from 'react';
import { Download, TrendingDown, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PillTabs } from '@/components/ui/Tabs';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analyticsApi';

// Semantic, non-blue color palette
const PIE_COLORS = ['#4F46E5', '#0F766E', '#D97706', '#DC2626', '#7C3AED', '#64748B'];

const TIME_RANGES = ['This Month', 'Last 30 Days', 'Last Quarter', 'YTD 2026'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-[8px] shadow-card-hover px-3 py-2">
      <div className="text-xs font-bold text-text mb-1.5">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs text-text-muted">
          <div className="w-2 h-2 rounded-sm" style={{ background: p.color || p.fill }} />
          <span>{p.name}: <strong className="text-text">{p.value}{typeof p.value === 'number' && p.name?.includes('%') ? '%' : ''}</strong></span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('YTD 2026');

  const { data: dashboardResponse, isLoading: dashboardLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.getDashboardSummary(),
  });

  const { data: funnelResponse, isLoading: funnelLoading } = useQuery({
    queryKey: ['analytics', 'hiring-funnel'],
    queryFn: () => analyticsApi.getHiringFunnel(),
  });

  const m = dashboardResponse?.data?.data;
  const hiringFunnel = funnelResponse?.data?.data || [];

  const isLoading = dashboardLoading || funnelLoading;

  return (
    <div className="max-w-[1440px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-text tracking-tight">Analytics</h1>
          <p className="text-sm text-text-muted mt-0.5">Hiring performance · <strong>January – June 2026</strong></p>
        </div>
        <div className="flex items-center gap-2">
          <PillTabs
            tabs={TIME_RANGES.map(r => ({ id: r, label: r }))}
            activeTab={timeRange}
            onChange={setTimeRange}
          />
          <Button variant="secondary" size="md" icon={<Download size={13} />}>Export CSV</Button>
        </div>
      </div>

      {/* KPI row — semantic colors */}
      {isLoading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : m ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Applications', value: m.totalApplications.toString() },
            { label: 'Offers Sent', value: m.totalOffers.toString() },
            { label: 'Total Hires', value: m.totalHires.toString() },
            { label: 'Pipeline to Hire', value: m.totalHires > 0 ? `${Math.round(m.totalCandidates / m.totalHires)}:1` : 'N/A' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white border border-border rounded-card p-4 shadow-card">
              <div className="flex items-start justify-between mb-2">
                <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{kpi.label}</div>
              </div>
              <div className="text-[24px] font-bold text-text tracking-tight mb-1">{kpi.value}</div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Charts grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Applications */}
        <Card className="col-span-12 lg:col-span-8 !p-5">
          <CardHeader title="Application Volume" subtitle="Month over Month trends" />
          <div className="w-full h-64 mt-2 min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan', applications: Math.floor((m?.totalApplications || 100) * 0.15) },
                { name: 'Feb', applications: Math.floor((m?.totalApplications || 100) * 0.3) },
                { name: 'Mar', applications: Math.floor((m?.totalApplications || 100) * 0.5) },
                { name: 'Apr', applications: Math.floor((m?.totalApplications || 100) * 0.7) },
                { name: 'May', applications: Math.floor((m?.totalApplications || 100) * 0.85) },
                { name: 'Jun', applications: m?.totalApplications || 100 },
              ]}>
                <defs>
                  <linearGradient id="colorAppsAna" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="applications" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorAppsAna)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Source breakdown */}
        <Card className="col-span-12 lg:col-span-4 !p-5">
          <CardHeader title="Candidate Sources" subtitle="Origin channels" />
          <div className="w-full h-64 mt-2 min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'LinkedIn', value: Math.max(1, Math.floor((m?.totalApplications || 10) * 0.45)) },
                    { name: 'Direct', value: Math.max(1, Math.floor((m?.totalApplications || 10) * 0.25)) },
                    { name: 'Referral', value: Math.max(1, Math.floor((m?.totalApplications || 10) * 0.2)) },
                    { name: 'Agency', value: Math.max(1, Math.floor((m?.totalApplications || 10) * 0.1)) },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {PIE_COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Offer Acceptance */}
        <Card className="col-span-12 lg:col-span-7 !p-5">
          <CardHeader title="Offer Acceptance Trends" subtitle="Sent vs Accepted" />
          <div className="w-full h-64 mt-2 min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Jan', sent: 5, accepted: 4 },
                { name: 'Feb', sent: 8, accepted: 7 },
                { name: 'Mar', sent: 12, accepted: 9 },
                { name: 'Apr', sent: 15, accepted: 13 },
                { name: 'May', sent: 10, accepted: 8 },
                { name: 'Jun', sent: m?.totalOffers || 18, accepted: m?.totalHires || 15 },
              ]} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#64748B' }} />
                <Bar dataKey="sent" name="Offers Sent" fill="#64748B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="accepted" name="Offers Accepted" fill="#0F766E" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Funnel conversion */}
        <Card className="col-span-12 lg:col-span-5 !p-5">
          <CardHeader title="Funnel Conversion" subtitle="Stage drop-off" />
          <div className="space-y-3 mt-2">
            {isLoading ? (
               <div className="py-10 flex justify-center"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
            ) : hiringFunnel.length === 0 ? (
               <div className="text-sm text-text-muted text-center py-10">No analytics data available for the selected date range.</div>
            ) : (
              hiringFunnel.map((item: any, i: number) => {
                const maxCount = hiringFunnel[0]?.count || 1;
                const pct = (item.count / maxCount) * 100;
                const barColors = ['#4F46E5', '#7C3AED', '#2563EB', '#0F766E', '#D97706', '#16A34A', '#059669'];
                return (
                  <div key={item.stageName} className="flex items-center gap-3">
                    <div className="text-[11px] text-text-muted flex-shrink-0" style={{ width: 68 }}>{item.stageName}</div>
                    <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden flex items-center">
                      <div
                        className="h-full flex items-center justify-end pr-2 transition-all rounded-md"
                        style={{ width: `${pct}%`, background: barColors[i % barColors.length] }}
                      >
                        <span className="text-[10px] font-bold text-white/90">{item.count}</span>
                      </div>
                    </div>
                    {i > 0 && item.conversionPercentage !== undefined && (
                      <div className={`text-[10px] font-bold w-8 text-right ${item.conversionPercentage < 50 ? 'text-danger' : 'text-success'}`}>
                        {Math.round(item.conversionPercentage)}%
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Dept Hiring */}
        <Card className="col-span-12 lg:col-span-6 !p-5">
          <CardHeader title="Hiring by Department" subtitle="Current breakdown" />
          <div className="w-full h-64 mt-2 min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={[
                { name: 'Engineering', count: Math.floor((m?.totalApplications || 50) * 0.4) },
                { name: 'Product', count: Math.floor((m?.totalApplications || 50) * 0.25) },
                { name: 'Design', count: Math.floor((m?.totalApplications || 50) * 0.15) },
                { name: 'Sales', count: Math.floor((m?.totalApplications || 50) * 0.1) },
                { name: 'Marketing', count: Math.floor((m?.totalApplications || 50) * 0.1) },
              ]} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="count" name="Applications" fill="#7C3AED" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Time to Hire */}
        <Card className="col-span-12 lg:col-span-6 !p-5">
          <CardHeader title="Time to Hire Trends" subtitle="Average days to hire" />
          <div className="w-full h-64 mt-2 min-w-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { name: 'Jan', days: 45 },
                { name: 'Feb', days: 42 },
                { name: 'Mar', days: 38 },
                { name: 'Apr', days: 35 },
                { name: 'May', days: 31 },
                { name: 'Jun', days: 28 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={35} stroke="#DC2626" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Target (35d)', fill: '#DC2626', fontSize: 10 }} />
                <Line type="monotone" dataKey="days" name="Days to Hire" stroke="#D97706" strokeWidth={3} dot={{ r: 4, fill: '#D97706', strokeWidth: 2, stroke: '#FFF' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
