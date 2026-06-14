import { describe, expect, it } from 'vitest';
import { validateAllSteps } from '../../schemas/schemaFactory';
import { getDocumentRequirements } from '../../schemas/step7Schema';
import { isCoApplicantStepVisible } from '../../components/wizard/stepRegistry';
import { buildLoanSummary } from '../../utils/emiCalculator';
import { allIntegrationFixtures } from '../integrationFixtures';

describe('all loan and employment combinations', () => {
  it.each(Object.entries(allIntegrationFixtures))('%s passes every visible step schema', async (_name, fixture) => {
    const needsCoApplicant = fixture.loanType.loanType === 'Home'
      || fixture.loanType.loanAmount > 2000000
      || (fixture.loanType.loanType === 'Personal' && fixture.loanType.loanAmount > 500000);
    expect(isCoApplicantStepVisible(fixture)).toBe(needsCoApplicant);

    const requirementIds = getDocumentRequirements(fixture).map(({ id }) => id);
    expect(requirementIds).toContain(fixture.employment.employmentType === 'Salaried' ? 'salarySlips' : 'itrDocs');
    expect(requirementIds.includes('propertyDocs')).toBe(fixture.loanType.loanType === 'Home');
    expect(requirementIds.includes('businessRegistration')).toBe(fixture.loanType.loanType === 'Business');

    const combinedIncome = fixture.employment.monthlyIncomeForEMI
      + Number(fixture.coApplicant.coApplicantIncome || 0);
    const summary = buildLoanSummary(
      fixture.loanType.loanType,
      fixture.loanType.loanAmount,
      fixture.loanType.loanTenure,
      combinedIncome,
    );
    expect(summary.emi).toBeGreaterThan(0);
    expect(Number.isFinite(summary.emiToIncomeRatio)).toBe(true);
    await expect(validateAllSteps(fixture)).resolves.toEqual({ valid: true, stepErrors: {} });
  });
});
