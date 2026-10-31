import { PiiDetection } from '../types';

/**
 * Luhn Algorithm validation for credit cards (Visa, MasterCard, Amex, Discover)
 */
export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function detectDeterministicPii(
  pageText: string,
  pageIndex: number = 0
): PiiDetection[] {
  const detections: PiiDetection[] = [];

  // 1. Email Regex
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  let match: RegExpExecArray | null;
  while ((match = emailRegex.exec(pageText)) !== null) {
    detections.push({
      id: Math.random().toString(36).substring(2, 9),
      category: 'email',
      text: match[0],
      confidence: 0.99,
      page: pageIndex + 1,
      approved: true,
    });
  }

  // 2. Phone Numbers (US & International formats)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
  while ((match = phoneRegex.exec(pageText)) !== null) {
    // Avoid false positives like dates
    if (!match[0].includes('/') && match[0].replace(/\D/g, '').length >= 10) {
      detections.push({
        id: Math.random().toString(36).substring(2, 9),
        category: 'phone',
        text: match[0],
        confidence: 0.95,
        page: pageIndex + 1,
        approved: true,
      });
    }
  }

  // 3. Credit Card Numbers (Candidate regex + Luhn checksum)
  const cardCandidateRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
  while ((match = cardCandidateRegex.exec(pageText)) !== null) {
    if (validateLuhn(match[0])) {
      detections.push({
        id: Math.random().toString(36).substring(2, 9),
        category: 'credit-card',
        text: match[0],
        confidence: 0.99,
        page: pageIndex + 1,
        approved: true,
      });
    }
  }

  // 4. US SSN (XXX-XX-XXXX)
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  while ((match = ssnRegex.exec(pageText)) !== null) {
    detections.push({
      id: Math.random().toString(36).substring(2, 9),
      category: 'national-id',
      text: match[0],
      confidence: 0.98,
      page: pageIndex + 1,
      approved: true,
    });
  }

  return detections;
}
