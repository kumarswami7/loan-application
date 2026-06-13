import { useEffect, useState } from 'react';
import { validateAadhaarChecksum, validatePAN } from '../utils/validators';

const INITIAL_STATE = {
  isVerifying: false,
  isVerified: false,
};

const VALIDATORS = {
  PAN: validatePAN,
  AADHAAR: validateAadhaarChecksum,
};

export default function useVerification(value, type) {
  const [cycle, setCycle] = useState({
    value: null,
    type: null,
    ...INITIAL_STATE,
  });

  const validator = VALIDATORS[type];
  const validation = validator && value ? validator(value) : null;
  const validationIsValid = validation?.valid === true;
  const validationError = validation?.error;
  const isCurrentCycle = cycle.value === value && cycle.type === type;

  useEffect(() => {
    if (!validator || !value || !validationIsValid) return undefined;

    let verificationTimer;
    const debounceTimer = setTimeout(() => {
      setCycle({ value, type, isVerifying: true, isVerified: false });
      verificationTimer = setTimeout(() => {
        setCycle({ value, type, isVerifying: false, isVerified: true });
      }, 1500);
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(verificationTimer);
    };
  }, [type, validationIsValid, validator, value]);

  if (!validator) {
    return { ...INITIAL_STATE, error: `Unsupported verification type: ${type}` };
  }
  if (!value) return { ...INITIAL_STATE, error: null };
  if (!validationIsValid) return { ...INITIAL_STATE, error: validationError };
  if (!isCurrentCycle) return { ...INITIAL_STATE, error: null };

  return {
    isVerifying: cycle.isVerifying,
    isVerified: cycle.isVerified,
    error: null,
  };
}
