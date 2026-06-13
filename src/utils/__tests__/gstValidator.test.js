import { describe, expect, it } from 'vitest';
import { GST_STATE_CODES, validateGST } from '../gstValidator';

describe('validateGST', () => {
  it('accepts a valid Maharashtra GST number and returns its state', () => {
    expect(validateGST('27AAAPA1234A1Z5')).toEqual({
      valid: true,
      stateFromGST: 'Maharashtra',
    });
  });

  it('looks up Karnataka from its GST state code', () => {
    expect(validateGST('29AAAPA1234A1Z5').stateFromGST).toBe('Karnataka');
  });

  it('looks up Delhi from its GST state code', () => {
    expect(validateGST('07AAAPA1234A1Z5').stateFromGST).toBe('Delhi');
  });

  it.each([
    ['27AAAPA1234A1Z', 'wrong length'],
    ['27aaapa1234a1z5', 'lowercase'],
    ['27AAAPA1234A1X5', 'missing Z literal'],
    ['2XAAAPA1234A1Z5', 'non-numeric state code'],
  ])('rejects invalid format: %s (%s)', (gst) => {
    expect(validateGST(gst).error).toBe(
      "GST number must be 15 characters in the format: 2-digit state code + 10-char PAN + entity number + 'Z' + checksum",
    );
  });

  it('rejects a GST number containing a PAN with an invalid entity type', () => {
    expect(validateGST('27AAAZA1234A1Z5')).toEqual({
      valid: false,
      error: 'GST number contains an invalid PAN',
    });
  });

  it('exports the required state code map', () => {
    expect(GST_STATE_CODES).toMatchObject({
      '01': 'Jammu & Kashmir',
      '19': 'West Bengal',
      '27': 'Maharashtra',
      '37': 'Andhra Pradesh',
    });
  });

  it('allows a valid format with an unmapped state code', () => {
    expect(validateGST('99AAAPA1234A1Z5')).toEqual({
      valid: true,
      stateFromGST: undefined,
    });
  });
});
