import { InvoiceData } from './schemas';

export interface CrossCheckWarning {
  field: string;
  expected: string | number;
  actual: string | number;
  message: string;
}

export function performInvoiceCrossChecks(invoice: InvoiceData): CrossCheckWarning[] {
  const warnings: CrossCheckWarning[] = [];

  // Check 1: Line items sum vs Subtotal
  if (invoice.lineItems.length > 0) {
    const calculatedSum = invoice.lineItems.reduce((acc, item) => acc + (item.amount || item.quantity * item.unitPrice), 0);
    const diff = Math.abs(calculatedSum - invoice.subtotal);
    if (diff > 0.05) {
      warnings.push({
        field: 'subtotal',
        expected: Number(calculatedSum.toFixed(2)),
        actual: invoice.subtotal,
        message: `Sum of line items ($${calculatedSum.toFixed(2)}) differs from listed subtotal ($${invoice.subtotal.toFixed(2)}).`,
      });
    }
  }

  // Check 2: Subtotal + Tax vs Total
  const calculatedTotal = invoice.subtotal + (invoice.taxAmount || 0);
  const totalDiff = Math.abs(calculatedTotal - invoice.total);
  if (totalDiff > 0.05) {
    warnings.push({
      field: 'total',
      expected: Number(calculatedTotal.toFixed(2)),
      actual: invoice.total,
      message: `Subtotal + Tax ($${calculatedTotal.toFixed(2)}) differs from grand total ($${invoice.total.toFixed(2)}).`,
    });
  }

  // Check 3: Date sanity
  const parsedDate = Date.parse(invoice.date);
  if (isNaN(parsedDate)) {
    warnings.push({
      field: 'date',
      expected: 'Valid ISO or date string',
      actual: invoice.date,
      message: `Unrecognized invoice date format "${invoice.date}".`,
    });
  }

  return warnings;
}
