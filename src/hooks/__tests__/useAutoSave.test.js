import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useAutoSave from '../useAutoSave';

vi.mock('../../utils/encryption', () => ({
  LENDSWIFT_PASSPHRASE: 'test-passphrase',
  encryptData: vi.fn(async (plaintext) => `encrypted:${plaintext}`),
}));

const formData = { loanType: { loanType: 'Personal', loanAmount: 500000 } };

describe('useAutoSave', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('writes encrypted draft and metadata after 30 seconds', async () => {
    renderHook(() => useAutoSave(formData, 'loanType', 'Personal'));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(localStorage.getItem('lendswift_draft_Personal')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('lendswift_draft_meta_Personal'))).toMatchObject({
      version: '1.0',
      step: 'loanType',
      loanType: 'Personal',
    });
  });

  it('manual save writes immediately without waiting for the interval', async () => {
    const { result } = renderHook(() => useAutoSave(formData, 'personalInfo', 'Personal'));

    await act(async () => {
      await result.current.triggerManualSave();
    });

    expect(localStorage.getItem('lendswift_draft_Personal')).toBeTruthy();
  });

  it('shows a toast after save and hides it after 2 seconds', async () => {
    const { result } = renderHook(() => useAutoSave(formData, 'loanType', 'Personal'));

    await act(async () => {
      await result.current.triggerManualSave();
    });
    expect(result.current.showToast).toBe(true);
    expect(result.current.toastMessage).toMatch(/^Draft saved at \d{2}:\d{2}:\d{2}$/);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.showToast).toBe(false);
  });

  it('resets the debounce when form data changes', async () => {
    const { rerender } = renderHook(
      ({ data }) => useAutoSave(data, 'loanType', 'Personal'),
      { initialProps: { data: formData } },
    );

    act(() => vi.advanceTimersByTime(20000));
    rerender({ data: { ...formData, loanType: { ...formData.loanType, loanAmount: 600000 } } });
    act(() => vi.advanceTimersByTime(29999));
    expect(localStorage.getItem('lendswift_draft_Personal')).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(localStorage.getItem('lendswift_draft_Personal')).toBeTruthy();
  });
});
