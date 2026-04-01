import React from "react";
import { Page, Text, View, Document, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

// Register fonts
Font.register({
  family: "Quicksand",
  fonts: [
    { src: "https://fonts.gstatic.com/s/quicksand/v30/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkP8o58m-wi40.ttf", fontWeight: "normal" },
    { src: "https://fonts.gstatic.com/s/quicksand/v30/6xK-dSZaM9iE8KbpRA_LJ3z8mH9BOJvgkBgv58m-wi40.ttf", fontWeight: "bold" },
  ]
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 50,
    paddingRight: 50,
    fontFamily: "Quicksand",
    fontSize: 10,
    color: "#000000",
  },
  // Header
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  logoBlock: {
    width: 48,
    height: 48,
    backgroundColor: "#717f65",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderRadius: 4,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Helvetica",
    fontWeight: "bold",
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#32612d",
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: "normal",
    color: "#717f65",
    letterSpacing: 2,
    marginBottom: 6,
  },
  brandInfo: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.4,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#32612d",
    marginBottom: 6,
    letterSpacing: 1,
  },
  invoiceMeta: {
    fontSize: 10,
    color: "#333333",
    marginBottom: 3,
  },
  invoiceNo: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#717f65",
    borderBottomStyle: "solid",
    marginBottom: 20,
  },
  // Bill To Section
  billToContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  billToCol: {
    width: "48%",
  },
  sectionLabel: {
    fontSize: 8,
    color: "#717f65",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: "bold",
  },
  customerName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 10,
    marginBottom: 3,
    color: "#333333",
  },
  // Order Table
  table: {
    width: "100%",
    borderWidth: 0.5,
    borderColor: "#d6d0c4",
    borderStyle: "solid",
    marginBottom: 25,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#32612d",
    color: "#f2efe6",
    fontWeight: "bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderColor: "#d6d0c4",
    borderStyle: "solid",
  },
  colNo: { width: "8%", padding: 8, borderRightWidth: 0.5, borderColor: "#d6d0c4" },
  colDesc: { width: "42%", padding: 8, borderRightWidth: 0.5, borderColor: "#d6d0c4" },
  colQty: { width: "15%", padding: 8, borderRightWidth: 0.5, borderColor: "#d6d0c4" },
  colRate: { width: "15%", padding: 8, borderRightWidth: 0.5, borderColor: "#d6d0c4" },
  colTotal: { width: "20%", padding: 8, textAlign: "right" },
  
  toleranceText: {
    fontSize: 8,
    fontStyle: "italic",
    color: "#9a9485",
    marginTop: 4,
  },

  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 8,
  },
  totalsText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#32612d",
  },

  // Payment Section
  paymentSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  paymentColLeft: {
    width: "48%",
  },
  paymentColRight: {
    width: "48%",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: "#d6d0c4",
  },
  paymentLabel: {
    fontSize: 10,
    color: "#333333",
  },
  paymentValue: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
  },
  unpaidBalance: {
    color: "#c0392b",
    fontWeight: "bold",
  },
  paymentTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#32612d",
    textAlign: "right",
  },
  badge: {
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: 4,
    color: "#ffffff",
  },
  badgeOnline: { backgroundColor: "#0284c7" },
  badgeCash: { backgroundColor: "#d97706" },

  // Signatures
  signatureArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "auto",
    marginBottom: 20,
  },
  sigBox: {
    width: "40%",
    borderWidth: 1,
    borderColor: "#d6d0c4",
    borderStyle: "dashed",
    padding: 15,
    alignItems: "center",
  },
  sigTitle: {
    fontSize: 9,
    color: "#717f65",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 40,
  },
  sigLine: {
    width: "80%",
    borderBottomWidth: 1,
    borderColor: "#000000",
    marginBottom: 5,
  },
  sigSub: {
    fontSize: 8,
    color: "#666666",
  },

  // Footer
  footerRow: {
    borderTopWidth: 1,
    borderColor: "#717f65",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#717f65",
  },
  footerQueries: {
    fontSize: 8,
    color: "#9a9485",
    marginTop: 4,
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 8,
    color: "#9a9485",
  }
});

interface PDFData {
  invoiceNumber?: string;
  date?: string | Date;
  customerName: string;
  phone: string;
  brideName?: string | null;
  groomName?: string | null;
  modelNumber?: string | null;
  description: string;
  category?: string;
  quantity: number;
  unitRate: number;
  advancePaid: boolean;
  advanceAmount?: number | null;
  advanceMode?: string | null;
  balancePaid?: boolean;
  balanceMode?: string | null;
  estimatedDesignTime?: string | null;
  estimatedPrintTime?: string | null;
  finalDeliveryDate?: string | Date | null;
  packing: string;
}

function fmtCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount || 0);
}

function safeDate(d: any) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch (e) {
    return "—";
  }
}

export const InvoicePDF = ({ data }: { data: PDFData }) => {
  const quantity = Number(data.quantity) || 0;
  const toleranceQuantity = Math.floor(quantity * 0.95);
  const unitRate = Number(data.unitRate) || 0;
  const totalAmount = quantity * unitRate;
  
  const advanceAmount = data.advancePaid ? Number(data.advanceAmount || 0) : 0;
  const balance = totalAmount - advanceAmount;
  const isBalanceUnpaid = balance > 0 && !data.balancePaid;

  const studioAddress = process.env.NEXT_PUBLIC_STUDIO_ADDRESS || "123 Printing Hub Road, Creative District\nHyderabad, TG 500001";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <View>
            <View style={styles.logoBlock}>
              <Text style={styles.logoText}>I&P</Text>
            </View>
            <Text style={styles.brandTitle}>INK & PRINT STUDIO</Text>
            <Text style={styles.brandSubtitle}>STUDIO</Text>
            <Text style={styles.brandInfo}>{studioAddress}</Text>
            <Text style={styles.brandInfo}>Ph: +91 98765 43210 | Email: hello@inkandprint.com</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNo}>Invoice No: {data.invoiceNumber || "DRAFT"}</Text>
            <Text style={styles.invoiceMeta}>Date: {safeDate(data.date || new Date())}</Text>
            <Text style={styles.invoiceMeta}>Category: {data.category || "General"}</Text>
          </View>
        </View>

        <View style={styles.hr} />

        {/* BILL TO & ORDER DETAILS */}
        <View style={styles.billToContainer}>
          <View style={styles.billToCol}>
            <Text style={styles.sectionLabel}>BILL TO:</Text>
            <Text style={styles.customerName}>{data.customerName || "Customer"}</Text>
            <Text style={styles.infoText}>Phone: {data.phone || "—"}</Text>
            {(data.brideName || data.groomName) && (
              <Text style={styles.infoText}>Couple: {data.brideName || ""} {data.brideName && data.groomName ? "&" : ""} {data.groomName || ""}</Text>
            )}
            <Text style={styles.infoText}>Model No: {data.modelNumber || "—"}</Text>
          </View>

          <View style={styles.billToCol}>
            <Text style={styles.sectionLabel}>ORDER DETAILS:</Text>
            <Text style={styles.infoText}>Description: {data.description || "—"}</Text>
            <Text style={styles.infoText}>Packing: {data.packing === "WITH_PACKING" ? "With Packing" : "Without Packing"}</Text>
            <Text style={styles.infoText}>Final Delivery: {safeDate(data.finalDeliveryDate)}</Text>
          </View>
        </View>

        {/* TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colNo}>#</Text>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Quantity</Text>
            <Text style={styles.colRate}>Unit Rate</Text>
            <Text style={styles.colTotal}>Total Amount</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.colNo}>1</Text>
            <Text style={styles.colDesc}>{data.description}</Text>
            <View style={styles.colQty}>
              <Text>{quantity}</Text>
              <Text style={styles.toleranceText}>* 5% tolerance: eff. qty ~{toleranceQuantity}</Text>
            </View>
            <Text style={styles.colRate}>{fmtCurrency(unitRate)}</Text>
            <Text style={styles.colTotal}>{fmtCurrency(totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.totalsRow}>
          <Text style={styles.totalsText}>Sub Total: {fmtCurrency(totalAmount)}</Text>
        </View>

        {/* PAYMENT & TIMELINES */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentColLeft}>
            <Text style={styles.sectionLabel}>PAYMENT DETAILS:</Text>
            
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Advance Paid</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.paymentValue}>
                  {data.advancePaid ? fmtCurrency(advanceAmount) : "Not Paid"}
                </Text>
                {data.advancePaid && data.advanceMode && (
                  <Text style={[styles.badge, data.advanceMode.toUpperCase() === "ONLINE" ? styles.badgeOnline : styles.badgeCash]}>
                    {data.advanceMode.toUpperCase()}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Balance Due</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.paymentValue, isBalanceUnpaid ? styles.unpaidBalance : {}]}>
                  {isBalanceUnpaid ? fmtCurrency(balance) : (balance <= 0 ? "₹0.00" : "Paid")}
                </Text>
                {data.balancePaid && data.balanceMode && (
                  <Text style={[styles.badge, data.balanceMode.toUpperCase() === "ONLINE" ? styles.badgeOnline : styles.badgeCash]}>
                    {data.balanceMode.toUpperCase()}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.paymentRow, { borderBottomWidth: 0, marginTop: 4 }]}>
              <Text style={[styles.paymentLabel, { fontWeight: "bold" }]}>Total Order Value</Text>
              <Text style={styles.paymentTotalValue}>{fmtCurrency(totalAmount)}</Text>
            </View>
          </View>

          <View style={styles.paymentColRight}>
            <Text style={styles.sectionLabel}>ESTIMATED TIMELINES:</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Design Completion</Text>
              <Text style={styles.paymentValue}>{data.estimatedDesignTime || "—"}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Print Turnaround</Text>
              <Text style={styles.paymentValue}>{data.estimatedPrintTime || "—"}</Text>
            </View>
            <Text style={[styles.toleranceText, { marginTop: 6 }]}>
              (Timelines begin after final proof confirmation)
            </Text>
          </View>
        </View>

        {/* SIGNATURES */}
        <View style={styles.signatureArea}>
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>Authorised Signatory</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigSub}>Ink & Print Studio</Text>
          </View>
          
          <View style={styles.sigBox}>
            <Text style={styles.sigTitle}>Customer Acknowledgement</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigSub}>Signature / Date</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.footerText}>Terms & Conditions: Advance paid is non-refundable. Delivery subject to proof confirmation.</Text>
            <Text style={styles.footerQueries}>For queries: +91 98765 43210 | hello@inkandprint.com</Text>
          </View>
          <Text style={[styles.footerText, { fontWeight: "bold" }]}>
            Thank you for choosing Ink & Print Studio!
          </Text>
        </View>
        
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Page ${pageNumber} of ${totalPages}`
        )} fixed />

      </Page>
    </Document>
  );
};
