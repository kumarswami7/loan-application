import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearDraft,
  resumeDraft,
  default as useFormPersistence,
} from '../useFormPersistence';
import { encryptData, LENDSWIFT_PASSPHRASE } from '../../utils/encryption';

const draft = {
  formData: { loanType: { loanType: 'Home', loanAmount: 5000000 } },
  currentStepId: 'address',
  loanType: 'Home',
};

function setMetadata(timestamp) {
  localStorage.setItem('lendswift_draft_meta_Home', JSON.stringify({
    version: '1.0',
    timestamp,
    step: 'address',
    loanType: 'Home',
  }));
}

describe('useFormPersistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-13T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('reports no saved draft when storage is empty', () => {
    const { result } = renderHook(() => useFormPersistence());
    expect(result.current).toEqual({ hasSavedDraft: false, draftMeta: null });
  });

  it('reports a saved draft within 72 hours', () => {
    setMetadata(new Date(Date.now() - 60 * 60 * 1000).toISOString());
    const { result } = renderHook(() => useFormPersistence());

    expect(result.current.hasSavedDraft).toBe(true);
    expect(result.current.draftMeta).toMatchObject({ loanType: 'Home', step: 'address' });
  });

  it('removes drafts older than 72 hours', () => {
    setMetadata(new Date(Date.now() - (73 * 60 * 60 * 1000)).toISOString());
    localStorage.setItem('lendswift_draft_Home', 'encrypted');

    const { result } = renderHook(() => useFormPersistence());

    expect(result.current.hasSavedDraft).toBe(false);
    expect(localStorage.getItem('lendswift_draft_Home')).toBeNull();
    expect(localStorage.getItem('lendswift_draft_meta_Home')).toBeNull();
  });

  it('resumes a valid encrypted draft', async () => {
    const encrypted = await encryptData(JSON.stringify(draft), LENDSWIFT_PASSPHRASE);
    localStorage.setItem('lendswift_draft_Home', encrypted);

    await expect(resumeDraft('Home')).resolves.toEqual(draft);
  });

  it('clears corrupted encrypted draft data', async () => {
    localStorage.setItem('lendswift_draft_Home', 'garbage-value');
    setMetadata(new Date().toISOString());

    await expect(resumeDraft('Home')).resolves.toBeNull();
    expect(localStorage.getItem('lendswift_draft_Home')).toBeNull();
    expect(localStorage.getItem('lendswift_draft_meta_Home')).toBeNull();
  });

  it('clearDraft removes both payload and metadata', () => {
    localStorage.setItem('lendswift_draft_Home', 'encrypted');
    setMetadata(new Date().toISOString());
    clearDraft('Home');
    expect(localStorage.length).toBe(0);
  });
});
