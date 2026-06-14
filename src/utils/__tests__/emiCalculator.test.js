import { describe, expect, it } from 'vitest';
import {
  buildLoanSummary,
  calculateEMI,
  calculateEMIToIncomeRatio,
  calculateProcessingFee,
  calculateTotalCostOfBorrowing,
  INTEREST_RATES,
} from '../emiCalculator';

describe('emiCalculator', () => {
  it('uses the configured Indian loan interest rates', () => {
    expect(INTEREST_RATES).toEqual({ Personal: 10.5, Home: 8.5, Business: 14 });
  });

  it('calculates EMI using the reducing-balance formula', () => {
    const principal = 500000;
    const monthlyRate = 10.5 / 12 / 100;
    const growth = (1 + monthlyRate) ** 36;
    const expected = principal * monthlyRate * growth / (growth - 1);
    expect(calculateEMI(principal, 10.5, 36)).toBeCloseTo(expected, 0);
  });

  it('handles a zero interest rate', () => {
    expect(calculateEMI(120000, 0, 12)).toBe(10000);
  });

  it('calculates total borrowing cost', () => {
    expect(calculateTotalCostOfBorrowing(17000, 36, 500000)).toBe(112000);
  });

  it('clamps a small processing fee to the minimum', () => {
    expect(calculateProcessingFee(50000)).toBe(2000);
  });

  it('clamps a large processing fee to the maximum', () => {
    expect(calculateProcessingFee(5000000)).toBe(25000);
  });

  it('returns zero ratio when income is unavailable', () => {
    expect(calculateEMIToIncomeRatio(25000, 0)).toBe(0);
  });

  it('does not flag a ratio at exactly 50 percent', () => {
    const emi = calculateEMI(120000, 10.5, 12);
    const summary = buildLoanSummary('Personal', 120000, 12, emi * 2);
    expect(summary.emiToIncomeRatio).toBe(50);
    expect(summary.exceedsAffordabilityThreshold).toBe(false);
  });

  it('flags ratios just above 50 percent and not just below', () => {
    const emi = calculateEMI(120000, 10.5, 12);
    const above = buildLoanSummary('Personal', 120000, 12, (emi * 2) - 1);
    const below = buildLoanSummary('Personal', 120000, 12, (emi * 2) + 1);
    expect(above.exceedsAffordabilityThreshold).toBe(true);
    expect(below.exceedsAffordabilityThreshold).toBe(false);
  });
});
