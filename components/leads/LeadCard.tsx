/* eslint-disable @typescript-eslint/no-explicit-any */
import { formatDistanceToNow } from "date-fns";
import { Pencil, Trash2, PhoneCall } from "lucide-react";

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-800 border-blue-200",
  CONTACTED: "bg-purple-100 text-purple-800 border-purple-200",
  NEGOTIATING: "bg-amber-100 text-amber-800 border-amber-200",
  CONVERTED: "bg-green-100 text-green-800 border-green-200",
  LOST: "bg-red-100 text-red-800 border-red-200",
};

export function LeadCard({ 
  lead, 
  onEdit, 
  onDelete, 
  isAdmin 
}: { 
  lead: any; 
  onEdit: (lead: any) => void; 
  onDelete: (id: string) => void;
  isAdmin: boolean;
}) {
  const statusColor = statusColors[lead.status] || "bg-slate-100 text-slate-800";
  const initials = lead.assignedTo?.name ? lead.assignedTo.name.substring(0, 2).toUpperCase() : "??";

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4 flex flex-col min-h-[180px] hover:shadow-md transition-shadow relative group">
      <div className="flex justify-between items-start mb-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
          {lead.category}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColor}`}>
          {lead.status}
        </span>
      </div>

      <h3 className="font-bold text-slate-900 mb-1 leading-tight">
        {lead.description} &mdash; {lead.quantity}
      </h3>

      <div className="mt-2 space-y-1 flex-1">
        <p className="text-sm font-medium text-slate-700">{lead.customerName}</p>
        <a href={`tel:${lead.phone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <PhoneCall className="w-3 h-3" /> {lead.phone}
        </a>
      </div>

      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-brand-forest text-white flex items-center justify-center text-[10px] font-bold" title={lead.assignedTo?.name}>
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900">₹{parseFloat(lead.estimatedBillValue).toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-slate-500">{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onEdit(lead)} 
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Edit Lead"
          >
            <Pencil className="w-4 h-4" />
          </button>
          
          {isAdmin && (
            <button 
              onClick={() => onDelete(lead.id)} 
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
