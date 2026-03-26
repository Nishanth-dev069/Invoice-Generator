import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function InvoicesPage() {
  const user = await requireAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-brand-navy">Invoices</h1>
        <Link 
          href="/dashboard/invoices/new" 
          className="inline-flex items-center justify-center rounded-md bg-brand-orange text-white px-4 py-2 text-sm font-medium hover:bg-brand-orange-hover transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Link>
      </div>
      
      <InvoiceTable currentUserRole={user.role} />
    </div>
  );
}
