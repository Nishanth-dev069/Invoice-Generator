/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Loader2, Download } from "lucide-react";
import { InvoicePDF } from "./InvoicePDF";

import { format } from "date-fns";

export default function PDFDownloadButton({ pdfData, invoiceNumber }: { pdfData: any, invoiceNumber: string }) {
  const safeName = (pdfData.customerName || "Customer").replace(/\s+/g, "_");
  const dateStr = pdfData.date ? format(new Date(pdfData.date), "dd-MM-yyyy") : format(new Date(), "dd-MM-yyyy");
  const fileName = `${invoiceNumber}_${safeName}_${dateStr}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoicePDF data={pdfData} />}
      fileName={fileName}
      className="inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 text-sm font-medium transition-colors"
    >
      {({ loading }) => (
        <>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Download PDF
        </>
      )}
    </PDFDownloadLink>
  );
}
