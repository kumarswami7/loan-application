import { useCallback, useEffect, useRef, useState } from 'react';
import { encryptData, LENDSWIFT_PASSPHRASE } from '../utils/encryption';

export default function useAutoSave(formData, currentStepId, loanType, interval = 30000) {
  const debounceTimer = useRef(null);
  const toastTimer = useRef(null);
  const [toast, setToast] = useState({ showToast: false, toastMessage: '' });

  const saveDraft = useCallback(async () => {
    const storageSuffix = loanType || 'unknown';
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify({
      formData,
      currentStepId,
      loanType,
    });
    const encrypted = await encryptData(payload, LENDSWIFT_PASSPHRASE);

    localStorage.setItem(`lendswift_draft_${storageSuffix}`, encrypted);
    localStorage.setItem(`lendswift_draft_meta_${storageSuffix}`, JSON.stringify({
      version: '1.0',
      timestamp,
      step: currentStepId,
      loanType,
    }));

    clearTimeout(toastTimer.current);
    setToast({
      showToast: true,
      toastMessage: `Draft saved at ${new Date(timestamp).toLocaleTimeString('en-GB')}`,
    });
    toastTimer.current = setTimeout(() => {
      setToast((current) => ({ ...current, showToast: false }));
    }, 2000);
  }, [currentStepId, formData, loanType]);

  const triggerManualSave = useCallback(async () => {
    clearTimeout(debounceTimer.current);
    await saveDraft();
  }, [saveDraft]);

  useEffect(() => {
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      void saveDraft();
    }, interval);

    return () => clearTimeout(debounceTimer.current);
  }, [currentStepId, formData, interval, loanType, saveDraft]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  return {
    showToast: toast.showToast,
    toastMessage: toast.toastMessage,
    triggerManualSave,
  };
}
