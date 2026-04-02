import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex w-full min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-brand-forest/60">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-medium animate-pulse">Loading workspace...</p>
      </div>
    </div>
  );
}
