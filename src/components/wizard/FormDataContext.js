import { createContext, useContext } from 'react';

/**
 * Shared context that holds the accumulated data from all completed steps,
 * plus the loan type / amount needed for cross-step conditional logic
 * (Section B3 dependency map).
 *
 * Each step's local React Hook Form instance writes its validated data
 * here when the user clicks "Next".
 */
export const FormDataContext = createContext(null);

export function useFormData() {
  const ctx = useContext(FormDataContext);
  if (!ctx) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return ctx;
}
