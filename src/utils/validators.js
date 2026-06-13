export const ENTITY_TYPE_MAP = {
  P: 'Individual',
  C: 'Company',
  H: 'HUF',
  A: 'AOP',
  B: 'BOI',
  G: 'Government',
  J: 'Artificial Juridical Person',
  L: 'Local Authority',
  F: 'Firm',
  T: 'Trust',
};

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const VOTER_ID_PATTERN = /^[A-Z]{3}\d{7}$/;
const PASSPORT_PATTERN = /^[A-Z]\d{7}$/;

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function validatePAN(pan) {
  if (!PAN_PATTERN.test(pan || '')) {
    return {
      valid: false,
      error: 'PAN must be 10 characters in format AAAAA9999A',
    };
  }

  if (!ENTITY_TYPE_MAP[pan[3]]) {
    return {
      valid: false,
      error: 'PAN 4th character must indicate entity type (P for Individual, C for Company, H for HUF, etc.)',
    };
  }

  return { valid: true };
}

export function validatePANForLoanType(pan, loanType) {
  const formatResult = validatePAN(pan);
  if (!formatResult.valid) return formatResult;

  const entityCharacter = pan[3];
  const entityType = ENTITY_TYPE_MAP[entityCharacter];

  if ((loanType === 'Personal' || loanType === 'Home') && entityCharacter !== 'P') {
    return {
      valid: false,
      error: "Only individual PAN (4th character 'P') is accepted for Personal and Home loans",
      entityType,
    };
  }

  if (loanType === 'Business' && !['P', 'C', 'F'].includes(entityCharacter)) {
    return {
      valid: false,
      error: 'Business loans require PAN type Individual (P), Company (C), or Firm (F)',
      entityType,
    };
  }

  return { valid: true, entityType };
}

export function validateAadhaarChecksum(aadhaar) {
  if (!/^\d{12}$/.test(aadhaar || '')) {
    return { valid: false, error: 'Aadhaar number must be exactly 12 digits' };
  }

  const checksum = [...aadhaar]
    .reverse()
    .reduce(
      (current, digit, index) => VERHOEFF_D[current][VERHOEFF_P[index % 8][Number(digit)]],
      0,
    );

  return checksum === 0
    ? { valid: true }
    : { valid: false, error: 'Invalid Aadhaar number (checksum failed)' };
}

export function validateVoterID(id) {
  return VOTER_ID_PATTERN.test(id || '')
    ? { valid: true }
    : { valid: false, error: 'Voter ID must be 3 letters followed by 7 digits' };
}

export function validatePassport(passport) {
  return PASSPORT_PATTERN.test(passport || '')
    ? { valid: true }
    : { valid: false, error: 'Passport number must be 1 letter followed by 7 digits' };
}
