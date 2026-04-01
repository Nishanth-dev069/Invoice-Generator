"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid,
  LineChart, Line, Legend
} from "recharts";
import { TeamMemberStat } from "./LeaderboardCard";
import { useSession } from "next-auth/react";

export function PerformanceCharts({ teamData }: { teamData: TeamMemberStat[] }) {
  const { data: session } = useSession();
  const [selectedUserId, setSelectedUserId] = useState<string>(session?.user?.id || "");
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loadingTrend, setLoadingTrend] = useState(false);

  // Initialize selected default
  useEffect(() => {
    if (!selectedUserId && session?.user?.id && teamData.find(t => t.userId === session.user.id)) {
      setSelectedUserId(session.user.id);
    } else if (!selectedUserId && teamData.length > 0) {
      setSelectedUserId(teamData[0].userId);
    }
  }, [session, teamData, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;
    const fetchTrend = async () => {
      setLoadingTrend(true);
      try {
        const res = await fetch(`/api/dashboard/user-trend?userId=${selectedUserId}&months=6`);
        const json = await res.json();
        if (json.success) setTrendData(json.data);
      } catch(e) { console.error(e); }
      setLoadingTrend(false);
    };
    fetchTrend();
  }, [selectedUserId]);

  // Chart 1: Invoices by Team Member
  const invoiceData = [...teamData].sort((a, b) => b.invoiceCount - a.invoiceCount);
  
  // Chart 2: Revenue by Team Member
  const revenueData = [...teamData].sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = revenueData.length > 0 ? revenueData[0].revenue : 1;

  // Custom tooltips
  const CustomTolltipInvoices = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg text-sm">
          <p className="font-bold mb-1">{payload[0].payload.name}</p>
          <p className="text-primary font-medium">Invoices: {payload[0].value}</p>
          <p className="text-muted-foreground text-xs mt-1">Closed: {payload[0].payload.completionRate.toFixed(0)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipRevenue = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg text-sm">
          <p className="font-bold mb-1">{payload[0].payload.name}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium font-mono">{formatCurrency(payload[0].value)}</p>
          <p className="text-muted-foreground text-xs mt-1">Avg/Invoice: {formatCurrency(payload[0].payload.avgInvoiceValue)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 col-span-1 lg:col-span-2">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Invoices Bar Chart */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6 pb-2 flex flex-col space-y-1.5 text-center md:text-left">
            <h3 className="font-semibold leading-none tracking-tight text-base">Invoices Generated</h3>
            <p className="text-sm text-slate-500">Total invoices created this month</p>
          </div>
          <div className="p-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoiceData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--accent)' }} content={<CustomTolltipInvoices />} />
                <Bar dataKey="invoiceCount" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {invoiceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.userId === session?.user?.id ? '#32612d' : '#8ba282'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue Bar Chart (Horizontal) */}
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6 pb-2 flex flex-col space-y-1.5 text-center md:text-left">
            <h3 className="font-semibold leading-none tracking-tight text-base">Revenue Leaderboard</h3>
            <p className="text-sm text-slate-500">Gross revenue generated this month</p>
          </div>
          <div className="p-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{fontSize: 12}} width={80} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--accent)' }} content={<CustomTooltipRevenue />} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={30}>
                  {revenueData.map((entry, index) => {
                    // Opacity relative to max revenue
                    const ratio = entry.revenue / maxRevenue;
                    const opacity = Math.max(0.4, ratio);
                    return <Cell key={`rcell-${index}`} fill={`rgba(50, 97, 45, ${opacity})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: Personal Trend Line */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h3 className="font-semibold leading-none tracking-tight text-base">Personal 6-Month Trend</h3>
            <p className="text-sm text-slate-500">Invoices and revenue progression</p>
          </div>
          <select 
            value={selectedUserId} 
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-[200px] h-8 text-xs rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" disabled>Select team member</option>
            {teamData.map(u => (
              <option key={u.userId} value={u.userId}>
                {u.name} {u.userId === session?.user?.id ? "(You)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="p-6 h-[280px]">
          {loadingTrend ? (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse">Loading trend...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `₹${v/1000}k`} tick={{fontSize: 11}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [name === 'revenue' ? formatCurrency(Number(value)) : value, name === 'revenue' ? 'Revenue' : 'Invoices']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="invoices" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="Invoices" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#32612d" strokeWidth={3} dot={{ r: 4, fill: '#32612d' }} activeDot={{ r: 6 }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
