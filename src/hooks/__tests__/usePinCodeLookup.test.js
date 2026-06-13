import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import usePinCodeLookup from '../usePinCodeLookup';

describe('usePinCodeLookup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('returns a known PIN code after debounce and lookup delays', () => {
    const { result } = renderHook(() => usePinCodeLookup('110001'));

    expect(result.current.isLoading).toBe(true);
    act(() => vi.advanceTimersByTime(699));
    expect(result.current.isLoading).toBe(true);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toEqual({
      city: 'New Delhi',
      state: 'Delhi',
      postOffice: 'Connaught Place',
      isLoading: false,
      error: null,
    });
  });

  it('returns a non-blocking error for an unknown PIN code', () => {
    const { result } = renderHook(() => usePinCodeLookup('999999'));

    act(() => vi.advanceTimersByTime(700));

    expect(result.current).toEqual({
      city: '',
      state: '',
      postOffice: '',
      isLoading: false,
      error: 'PIN code not found. Please verify and re-enter, or fill city/state manually.',
    });
  });

  it('does not look up or show an error for an incomplete PIN code', () => {
    const { result } = renderHook(() => usePinCodeLookup('11000'));

    act(() => vi.advanceTimersByTime(1000));

    expect(result.current).toEqual({
      city: '',
      state: '',
      postOffice: '',
      isLoading: false,
      error: null,
    });
  });

  it('discards a pending result when the PIN code changes', () => {
    const { result, rerender } = renderHook(
      ({ pincode }) => usePinCodeLookup(pincode),
      { initialProps: { pincode: '110001' } },
    );

    act(() => vi.advanceTimersByTime(350));
    rerender({ pincode: '400001' });
    act(() => vi.advanceTimersByTime(700));

    expect(result.current.city).toBe('Mumbai');
    expect(result.current.state).toBe('Maharashtra');
  });
});
