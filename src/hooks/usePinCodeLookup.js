import { useEffect, useState } from 'react';
import pinCodeData from '../utils/pinCodeData.json';

const EMPTY_RESULT = {
  city: '',
  state: '',
  postOffice: '',
  isLoading: false,
  error: null,
};

const NOT_FOUND_ERROR = 'PIN code not found. Please verify and re-enter, or fill city/state manually.';

export default function usePinCodeLookup(pincode) {
  const isLookupReady = /^\d{6}$/.test(pincode || '');
  const [completedLookup, setCompletedLookup] = useState(null);

  useEffect(() => {
    if (!isLookupReady) return undefined;

    let lookupTimer;
    const debounceTimer = setTimeout(() => {
      lookupTimer = setTimeout(() => {
        const match = pinCodeData.find((entry) => entry.pincode === pincode);
        setCompletedLookup({
          pincode,
          city: match?.city || '',
          state: match?.state || '',
          postOffice: match?.postOffice || '',
          error: match ? null : NOT_FOUND_ERROR,
        });
      }, 400);
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      clearTimeout(lookupTimer);
    };
  }, [isLookupReady, pincode]);

  if (!isLookupReady) return EMPTY_RESULT;
  if (completedLookup?.pincode !== pincode) {
    return { ...EMPTY_RESULT, isLoading: true };
  }

  return {
    city: completedLookup.city,
    state: completedLookup.state,
    postOffice: completedLookup.postOffice,
    isLoading: false,
    error: completedLookup.error,
  };
}
