"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

export function AdminAnalytics() {
  const [data, setData] = useState<{ monthlyData: any[]; categoryDistribution: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await fetch('/api/dashboard/admin-stats?months=12');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  if (loading) return <div className="animate-pulse h-48 bg-muted rounded-xl"></div>;
  if (!data) return null;

  const COLORS = ['#32612d', '#4a7d44', '#689d61', '#8ba282', '#aebf9f', '#c9d4c1'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 border-t pt-8">
      <div className="lg:col-span-3 mb-2">
        <h2 className="text-2xl font-bold tracking-tight">Admin & Executive Analytics</h2>
        <p className="text-muted-foreground text-sm">Long-term business insights and health metrics.</p>
      </div>

      <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm">
        <div className="p-6 pb-2 flex flex-col space-y-1.5 text-center sm:text-left">
          <h3 className="font-semibold leading-none tracking-tight text-base">12-Month Historical Breakdown</h3>
          <p className="text-sm text-slate-500">Volume, revenue, and top performers</p>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Month</th>
                <th className="pb-2 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Invoices</th>
                <th className="pb-2 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Closed</th>
                <th className="pb-2 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Revenue</th>
                <th className="pb-2 text-right font-semibold text-slate-500 text-xs uppercase tracking-wide">Avg Value</th>
                <th className="pb-2 pl-4 text-left font-semibold text-slate-500 text-xs uppercase tracking-wide">Top Salesperson</th>
              </tr>
            </thead>
            <tbody>
              {data.monthlyData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 border-b last:border-0 transition-colors">
                  <td className="py-3 font-medium whitespace-nowrap">{row.month}</td>
                  <td className="py-3 text-right">{row.totalInvoices}</td>
                  <td className="py-3 text-right">{row.closedJobs}</td>
                  <td className="py-3 text-right font-semibold">₹{parseFloat(String(row.revenue)).toLocaleString("en-IN")}</td>
                  <td className="py-3 text-right">₹{parseFloat(String(row.avgInvoiceValue)).toLocaleString("en-IN")}</td>
                  <td className="py-3 pl-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                      {row.topSalesperson}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 pb-2 flex flex-col space-y-1.5 text-center sm:text-left">
          <h3 className="font-semibold leading-none tracking-tight text-base">Category Distribution</h3>
          <p className="text-sm text-slate-500">Revenue by invoice category</p>
        </div>
        <div className="p-6 h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.categoryDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value: any) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
              />
              <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
