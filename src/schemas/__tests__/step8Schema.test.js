import { describe, expect, it } from 'vitest';
import { buildStep8Schema } from '../step8Schema';

const validConsents = {
  consentAccuracy: true,
  consentCreditCheck: true,
  consentTerms: true,
  consentCommunications: true,
};

describe('buildStep8Schema', () => {
  it.each([
    ['consentAccuracy', 'Please confirm the information provided is accurate'],
    ['consentCreditCheck', 'Please authorise the credit score check to proceed'],
    ['consentTerms', 'Please agree to the Terms and Conditions'],
    ['consentCommunications', 'Please consent to receive communications regarding this application'],
  ])('requires %s', (field, message) => {
    const result = buildStep8Schema(false).safeParse({ ...validConsents, [field]: false });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: [field], message }),
    ]));
  });

  it('does not require affordability acknowledgement below the threshold', () => {
    expect(buildStep8Schema(false).safeParse(validConsents).success).toBe(true);
  });

  it('requires affordability acknowledgement above the threshold', () => {
    const result = buildStep8Schema(true).safeParse(validConsents);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toEqual(['emiAffordabilityAcknowledged']);
  });

  it('accepts affordability acknowledgement above the threshold', () => {
    expect(buildStep8Schema(true).safeParse({
      ...validConsents,
      emiAffordabilityAcknowledged: true,
    }).success).toBe(true);
  });
});
