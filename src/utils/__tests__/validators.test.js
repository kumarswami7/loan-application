import { describe, expect, it } from 'vitest';
import {
  ENTITY_TYPE_MAP,
  validateAadhaarChecksum,
  validatePAN,
  validatePANForLoanType,
  validatePassport,
  validateVoterID,
} from '../validators';

const panForEntity = (entity) => `AAA${entity}A1234A`;

describe('validatePAN', () => {
  it('accepts a correctly formatted individual PAN', () => {
    expect(validatePAN('AAAPA1234A')).toEqual({ valid: true });
  });

  it.each(['AAAP1234A', 'aaapa1234a', 'AAAPA12345', 'AAAPA1234!'])(
    'rejects invalid PAN format: %s',
    (pan) => {
      expect(validatePAN(pan)).toEqual({
        valid: false,
        error: 'PAN must be 10 characters in format AAAAA9999A',
      });
    },
  );

  it('rejects an unsupported entity character', () => {
    expect(validatePAN('AAAZA1234A')).toEqual({
      valid: false,
      error: 'PAN 4th character must indicate entity type (P for Individual, C for Company, H for HUF, etc.)',
    });
  });

  it.each(Object.entries(ENTITY_TYPE_MAP))('accepts entity type %s (%s)', (entity) => {
    expect(validatePAN(panForEntity(entity))).toEqual({ valid: true });
  });
});

describe('validatePANForLoanType', () => {
  it.each(['Personal', 'Home'])('accepts individual PAN for %s loans', (loanType) => {
    expect(validatePANForLoanType(panForEntity('P'), loanType)).toEqual({
      valid: true,
      entityType: 'Individual',
    });
  });

  it.each(['Personal', 'Home'])('rejects company PAN for %s loans', (loanType) => {
    expect(validatePANForLoanType(panForEntity('C'), loanType).error).toBe(
      "Only individual PAN (4th character 'P') is accepted for Personal and Home loans",
    );
  });

  it.each([
    ['P', 'Individual'],
    ['C', 'Company'],
    ['F', 'Firm'],
  ])('accepts %s PAN for Business loans', (entity, entityType) => {
    expect(validatePANForLoanType(panForEntity(entity), 'Business')).toEqual({
      valid: true,
      entityType,
    });
  });

  it('rejects an unsupported PAN entity for Business loans', () => {
    expect(validatePANForLoanType(panForEntity('H'), 'Business').error).toBe(
      'Business loans require PAN type Individual (P), Company (C), or Firm (F)',
    );
  });
});

describe('validateAadhaarChecksum', () => {
  it.each(['123456789010', '234567890124', '987654321096'])(
    'accepts Verhoeff-valid Aadhaar number %s',
    (aadhaar) => {
      expect(validateAadhaarChecksum(aadhaar)).toEqual({ valid: true });
    },
  );

  it.each(['123456789011', '234567890125', '987654321097'])(
    'rejects corrupted Aadhaar number %s',
    (aadhaar) => {
      expect(validateAadhaarChecksum(aadhaar).error).toBe(
        'Invalid Aadhaar number (checksum failed)',
      );
    },
  );

  it.each(['12345678901', '12345678901A', ''])('rejects invalid Aadhaar format: %s', (aadhaar) => {
    expect(validateAadhaarChecksum(aadhaar).error).toBe(
      'Aadhaar number must be exactly 12 digits',
    );
  });
});

describe('secondary identity document validators', () => {
  it('accepts and rejects Voter ID formats', () => {
    expect(validateVoterID('ABC1234567')).toEqual({ valid: true });
    expect(validateVoterID('AB12345678').error).toBe(
      'Voter ID must be 3 letters followed by 7 digits',
    );
  });

  it('accepts and rejects passport formats', () => {
    expect(validatePassport('A1234567')).toEqual({ valid: true });
    expect(validatePassport('AB123456').error).toBe(
      'Passport number must be 1 letter followed by 7 digits',
    );
  });
});
