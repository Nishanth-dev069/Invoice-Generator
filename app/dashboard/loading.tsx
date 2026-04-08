import { DashboardSkeleton } from "@/components/dashboard/DashboardComponents";

export default function DashboardLoading() {
  return (
    <div className="w-full">
      <DashboardSkeleton />
    </div>
  );
}
