import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useVerification from '../useVerification';

describe('useVerification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('returns an immediate format error for invalid input', () => {
    const { result } = renderHook(() => useVerification('BADPAN', 'PAN'));

    expect(result.current).toEqual({
      isVerifying: false,
      isVerified: false,
      error: 'PAN must be 10 characters in format AAAAA9999A',
    });
  });

  it('moves valid PAN through debounce, verifying, and verified states', () => {
    const { result } = renderHook(() => useVerification('AAAPA1234A', 'PAN'));

    expect(result.current).toEqual({
      isVerifying: false,
      isVerified: false,
      error: null,
    });

    act(() => vi.advanceTimersByTime(500));
    expect(result.current.isVerifying).toBe(true);

    act(() => vi.advanceTimersByTime(1500));
    expect(result.current).toEqual({
      isVerifying: false,
      isVerified: true,
      error: null,
    });
  });

  it('verifies a checksum-valid Aadhaar number', () => {
    const { result } = renderHook(() => useVerification('123456789010', 'AADHAAR'));

    act(() => vi.advanceTimersByTime(2000));

    expect(result.current.isVerified).toBe(true);
  });

  it('resets verification and cancels the old cycle when the value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useVerification(value, 'PAN'),
      { initialProps: { value: 'AAAPA1234A' } },
    );

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.isVerified).toBe(true);

    rerender({ value: 'BBBPC5678D' });
    expect(result.current.isVerified).toBe(false);
    expect(result.current.isVerifying).toBe(false);

    act(() => vi.advanceTimersByTime(500));
    expect(result.current.isVerifying).toBe(true);

    act(() => vi.advanceTimersByTime(1500));
    expect(result.current.isVerified).toBe(true);
  });
});
