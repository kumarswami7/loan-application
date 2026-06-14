export const INTEREST_RATES = {
  Personal: 10.5,
  Home: 8.5,
  Business: 14,
};

export function calculateEMI(principal, annualRatePercent, tenureMonths) {
  const amount = Number(principal);
  const months = Number(tenureMonths);
  const monthlyRate = Number(annualRatePercent) / 12 / 100;

  if (!months) return 0;
  if (monthlyRate === 0) return Math.round(amount / months);

  const growth = (1 + monthlyRate) ** months;
  return Math.round((amount * monthlyRate * growth) / (growth - 1));
}

export function calculateTotalCostOfBorrowing(emi, tenureMonths, principal) {
  return (Number(emi) * Number(tenureMonths)) - Number(principal);
}

export function calculateProcessingFee(principal) {
  return Math.min(25000, Math.max(2000, Math.round(Number(principal) * 0.01)));
}

export function calculateEMIToIncomeRatio(emi, monthlyIncome) {
  return monthlyIncome ? (Number(emi) / Number(monthlyIncome)) * 100 : 0;
}

export function buildLoanSummary(loanType, principal, tenureMonths, monthlyIncome) {
  const interestRate = INTEREST_RATES[loanType];
  const emi = calculateEMI(principal, interestRate, tenureMonths);
  const emiToIncomeRatio = calculateEMIToIncomeRatio(emi, monthlyIncome);

  return {
    interestRate,
    emi,
    totalCostOfBorrowing: calculateTotalCostOfBorrowing(emi, tenureMonths, principal),
    processingFee: calculateProcessingFee(principal),
    emiToIncomeRatio,
    exceedsAffordabilityThreshold: emiToIncomeRatio > 50,
  };
}
