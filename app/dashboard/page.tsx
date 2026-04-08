/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { TeamPerformance } from "@/components/dashboard/TeamPerformance";
import { AdminAnalytics } from "@/components/dashboard/AdminAnalytics";
import {
  StatCard,
  UrgentDeliveriesPanel,
  WIPSummaryBar,
  RecentInvoicesTable,
  LeadsChart,
  FinalCheckStatus,
  DashboardSkeleton,
} from "@/components/dashboard/DashboardComponents";
import {
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dashboard-stats", currentMonth],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/stats?month=${currentMonth}`);
      if (!res.ok) throw new Error("Failed to load dashboard");
      const json = await res.json();
      return json.success ? json.data : json;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-forest">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Studio operational overview at a glance.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          title="Refresh Stats"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm font-medium">
          Failed to load dashboard stats. Please try refreshing.
        </div>
      ) : (
        <>
          {/* 6 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatCard
              label="Total Invoices"
              value={data.stats.totalInvoices}
              icon={FileText}
              accentClass="bg-blue-100 text-blue-600"
              href="/dashboard/invoices"
            />
            <StatCard
              label="Active Invoices"
              value={data.stats.activeInvoices}
              icon={TrendingUp}
              accentClass="bg-indigo-100 text-indigo-600"
              href="/dashboard/invoices?filter=active"
            />
            <StatCard
              label="Deliveries This Week"
              value={data.stats.deliveriesThisWeek}
              icon={Clock}
              accentClass="bg-amber-100 text-amber-600"
              subLabel="Due within 7 days"
              href="/dashboard/invoices?filter=deliveries"
            />
            <StatCard
              label="Overdue Invoices"
              value={data.stats.overdueInvoices}
              icon={AlertTriangle}
              accentClass={data.stats.overdueInvoices > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"}
              subLabel="Past delivery date"
              href="/dashboard/invoices?filter=overdue"
            />
            <StatCard
              label="Total Leads"
              value={data.stats.totalLeads}
              icon={Users}
              accentClass="bg-purple-100 text-purple-600"
              href="/dashboard/leads"
            />
            <StatCard
              label="Active WIP Items"
              value={data.stats.totalWip}
              icon={Layers}
              accentClass="bg-teal-100 text-teal-600"
              subLabel="Across all pipeline stages"
              href="/dashboard/work-in-progress"
            />
          </div>

          {/* Row: Urgent + WIP Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Urgent Deliveries — header is rendered inside the component */}
            <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
              <UrgentDeliveriesPanel deliveries={data.urgentDeliveries} />
            </div>

            {/* WIP Pipeline */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">WIP Pipeline</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{data.stats.totalWip} total items</p>
                </div>
                <Link
                  href="/dashboard/work-in-progress"
                  className="text-xs font-semibold text-brand-forest hover:underline flex items-center gap-1"
                >
                  Board <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <WIPSummaryBar phases={data.wipPhases} total={data.stats.totalWip} />
            </div>
          </div>

          {/* Row: Recent Invoices + Leads Chart + Final Check */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Invoices */}
            <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Recent Invoices</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Last 10 created</p>
                </div>
                <Link
                  href="/dashboard/invoices"
                  className="text-xs font-semibold text-brand-forest hover:underline flex items-center gap-1"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <RecentInvoicesTable invoices={data.recentInvoices} />
            </div>

            {/* Right column: Leads Chart + Final Check */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <div className="mb-3">
                  <h2 className="text-base font-bold text-slate-800">Leads by Status</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{data.stats.totalLeads} total leads</p>
                </div>
                <LeadsChart data={data.leadsByStatus} />
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-base font-bold text-slate-800 mb-4">Final Check Status</h2>
                <FinalCheckStatus
                  pending={data.finalCheck.pending}
                  completedThisMonth={data.finalCheck.completedThisMonth}
                />
              </div>
            </div>
          </div>

          <TeamPerformance />
          {session?.user?.role === "ADMIN" && <AdminAnalytics />}
        </>
      )}
    </div>
  );
}
