import { z } from "zod";

const stringMax = (max: number) => z.string().max(max, `Must be at most ${max} characters`);
const phoneRegex = /^[6-9]\d{9}$/;

export const phoneSchema = z.string().regex(phoneRegex, "Must be a valid 10-digit Indian mobile number");

export const positiveDecimal = z.number().nonnegative("Amount must be non-negative");

export const invoiceCreateSchema = z.object({
  customerName: stringMax(100).min(1),
  phone: phoneSchema,
  brideName: stringMax(100).optional().nullable(),
  groomName: stringMax(100).optional().nullable(),
  modelNumber: stringMax(100),
  category: stringMax(100),
  description: stringMax(500),
  date: z.string().datetime().optional().or(z.date()),
  quantity: z.number().int().positive(),
  unitRate: positiveDecimal,
  advancePaid: z.boolean().default(false),
  advanceAmount: positiveDecimal.optional().nullable(),
  advanceMode: z.enum(["ONLINE", "CASH"]).optional().nullable(),
  balanceMode: z.enum(["ONLINE", "CASH"]).optional().nullable(),
  estimatedDesignTime: stringMax(100),
  estimatedPrintTime: stringMax(100),
  packing: z.enum(["WITH_PACKING", "WITHOUT_PACKING"]),
  printingColor: stringMax(100).optional().nullable(),
  designer: stringMax(100).optional().nullable(),
  printer: stringMax(100).optional().nullable(),
  additionalNotes: stringMax(1000).optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  contentConfirmedOn: z.string().datetime().optional().nullable().or(z.date()),
  finalDeliveryDate: z.string().datetime().optional().nullable().or(z.date()),
});
export const invoiceSchema = invoiceCreateSchema;

export const leadCreateSchema = z.object({
  customerName: stringMax(100).min(1),
  phone: phoneSchema,
  category: stringMax(100),
  description: stringMax(500),
  quantity: z.number().int().positive(),
  assignedToId: z.string().uuid(),
  estimatedBillValue: positiveDecimal,
  notes: stringMax(1000).optional().nullable(),
  status: z.enum(["NEW", "CONTACTED", "NEGOTIATING", "CONVERTED", "LOST"]).optional().nullable(),
});
export const leadSchema = leadCreateSchema;

export const purchaseUpdateSchema = z.object({
  designer1Name: stringMax(100).optional().nullable(),
  designer1Cost: positiveDecimal.optional(),
  designer1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  designer1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).optional().nullable(),
  
  printer1Name: stringMax(100).optional().nullable(),
  printer1Cost: positiveDecimal.optional(),
  printer1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  printer1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).optional().nullable(),
  
  rawMaterial1Name: stringMax(100).optional().nullable(),
  rawMaterial1Cost: positiveDecimal.optional(),
  rawMaterial1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  rawMaterial1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).optional().nullable(),
  
  postProcess1Name: stringMax(100).optional().nullable(),
  postProcess1Cost: positiveDecimal.optional(),
  postProcess1PaymentStatus: z.enum(["PENDING", "PAID", "PARTIAL"]).optional(),
  postProcess1PaymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).optional().nullable(),
  
  notes: stringMax(1000).optional().nullable(),
}).partial();

export const wipChecklistUpdateSchema = z.record(z.string(), z.boolean());

export const expenseCreateSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  category: z.enum(["RENT", "SALARY", "ELECTRICITY", "FUEL", "INTERNET", "MISC", "OTHER"]),
  amount: positiveDecimal,
  description: stringMax(500).optional().nullable(),
  paidOn: z.string().datetime().optional().nullable().or(z.date()),
  paymentMode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]).optional().nullable(),
});

export const transactionCreateSchema = z.object({
  type: z.enum(["CREDIT", "DEBIT"]),
  mode: z.enum(["ONLINE", "CASH", "UPI", "BANK_TRANSFER"]),
  amount: positiveDecimal,
  description: stringMax(500),
  invoiceId: z.string().uuid().optional().nullable(),
  invoiceNumber: stringMax(50).optional().nullable(),
  category: z.enum([
    "INVOICE_ADVANCE", "INVOICE_BALANCE", "INVOICE_FULL_PAYMENT", 
    "VENDOR_PAYMENT", "OVERHEAD", "MISC_INCOME", "MISC_EXPENSE"
  ])
});
