"use client"; // Error components must be Client Components

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-red-50 text-red-600 p-4 rounded-full mb-4">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
        Something went wrong!
      </h2>
      <p className="text-slate-500 mb-6 max-w-md">
        An unexpected error occurred in the application. We've logged this issue, but you can try recovering by clicking the button below.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex h-10 items-center justify-center rounded-md bg-brand-forest px-8 text-sm font-medium text-white shadow transition-colors hover:bg-brand-forest/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
