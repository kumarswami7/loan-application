import { validatePAN } from './validators';

export const GST_STATE_CODES = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '19': 'West Bengal',
  '21': 'Odisha',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
};

const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const FORMAT_ERROR = "GST number must be 15 characters in the format: 2-digit state code + 10-char PAN + entity number + 'Z' + checksum";

export function validateGST(gst) {
  if (!GST_PATTERN.test(gst || '')) {
    return { valid: false, error: FORMAT_ERROR };
  }

  const embeddedPAN = gst.slice(2, 12);
  if (!validatePAN(embeddedPAN).valid) {
    return { valid: false, error: 'GST number contains an invalid PAN' };
  }

  return {
    valid: true,
    stateFromGST: GST_STATE_CODES[gst.slice(0, 2)],
  };
}

export default validateGST;
