/**
 * Formats a number using the Indian numbering system
 * (e.g. 1050000 -> "10,50,000" rather than "1,050,000").
 *
 * Uses Intl.NumberFormat with the en-IN locale, which handles the
 * lakh/crore grouping (3,2,2,2...) natively.
 */
export function formatIndianNumber(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Formats a number as Indian Rupees with the ₹ symbol,
 * e.g. 1050000 -> "₹10,50,000".
 */
export function formatINR(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return `₹${formatIndianNumber(num)}`;
}

/**
 * Strips formatting characters (commas, ₹, spaces) from a string,
 * returning a plain numeric string suitable for storing in form state
 * and passing to Zod's number validation.
 */
export function unformatNumber(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[₹,\s]/g, '');
}

/**
 * Converts a number into the Indian "lakh/crore" word form for display,
 * e.g. 1050000 -> "10.5 Lakh", 12500000 -> "1.25 Cr".
 * Used in helper text (e.g. "Max: 10 Lakh" for personal loans).
 */
export function toLakhCroreLabel(value) {
  const num = Number(value);
  if (Number.isNaN(num) || num === 0) return '0';

  if (num >= 1e7) {
    return `${(num / 1e7).toFixed(2).replace(/\.?0+$/, '')} Cr`;
  }
  if (num >= 1e5) {
    return `${(num / 1e5).toFixed(2).replace(/\.?0+$/, '')} Lakh`;
  }
  return formatIndianNumber(num);
}
