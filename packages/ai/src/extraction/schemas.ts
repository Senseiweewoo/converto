import { z } from 'zod';

export const LineItemSchema = z.object({
  description: z.string(),
  quantity: z.number().default(1),
  unitPrice: z.number().default(0),
  amount: z.number().default(0),
});

export const InvoiceSchema = z.object({
  invoiceNumber: z.string(),
  date: z.string(),
  dueDate: z.string().optional(),
  vendorName: z.string(),
  vendorTaxId: z.string().optional(),
  customerName: z.string().optional(),
  lineItems: z.array(LineItemSchema).default([]),
  subtotal: z.number(),
  taxRate: z.number().optional(),
  taxAmount: z.number().default(0),
  total: z.number(),
  currency: z.string().default('USD'),
});

export type InvoiceData = z.infer<typeof InvoiceSchema>;

export const ReceiptSchema = z.object({
  merchantName: z.string(),
  date: z.string(),
  totalAmount: z.number(),
  currency: z.string().default('USD'),
  paymentMethod: z.string().optional(),
  taxAmount: z.number().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
      })
    )
    .default([]),
});

export type ReceiptData = z.infer<typeof ReceiptSchema>;

export const BankStatementSchema = z.object({
  bankName: z.string(),
  accountNumberMasked: z.string(),
  statementPeriod: z.string(),
  startingBalance: z.number(),
  endingBalance: z.number(),
  currency: z.string().default('USD'),
  transactions: z
    .array(
      z.object({
        date: z.string(),
        description: z.string(),
        amount: z.number(),
        type: z.enum(['credit', 'debit']),
      })
    )
    .default([]),
});

export type BankStatementData = z.infer<typeof BankStatementSchema>;
