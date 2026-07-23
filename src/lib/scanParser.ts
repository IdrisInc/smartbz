/**
 * Parses a raw scanner result (barcode text, QR text, or URL) and extracts
 * device identifiers commonly found on phone boxes and electronics packaging.
 *
 * Recognises:
 *  - Bare 15-digit IMEI (`^\d{15}$`)
 *  - URLs with query params: imei, sn, serial, serialNumber, s_n (case-insensitive)
 *  - URLs whose path contains a 15-digit segment (treated as IMEI)
 *  - Anything else -> `kind: 'unknown'`, raw value preserved
 */
export type ScanKind = 'imei' | 'serial' | 'url' | 'unknown';

export interface ParsedScan {
  raw: string;
  kind: ScanKind;
  imei?: string;
  serial?: string;
  url?: string;
}

const IMEI_KEYS = ['imei', 'imei1', 'imei2', 'meid'];
const SERIAL_KEYS = ['sn', 's_n', 'serial', 'serialnumber', 'serialno', 'serial_no'];
const IMEI_REGEX = /\b\d{15}\b/;

function pickParam(params: URLSearchParams, keys: string[]): string | undefined {
  for (const [k, v] of params.entries()) {
    if (keys.includes(k.toLowerCase()) && v.trim()) return v.trim();
  }
  return undefined;
}

export function parseScanned(raw: string): ParsedScan {
  const value = (raw ?? '').trim();
  if (!value) return { raw: '', kind: 'unknown' };

  // Bare IMEI
  if (/^\d{15}$/.test(value)) {
    return { raw: value, kind: 'imei', imei: value };
  }

  // URL parsing
  if (/^https?:\/\//i.test(value)) {
    try {
      const u = new URL(value);
      const imei = pickParam(u.searchParams, IMEI_KEYS);
      const serial = pickParam(u.searchParams, SERIAL_KEYS);
      // Fallback: IMEI-shaped segment anywhere in URL
      const pathImei = !imei ? value.match(IMEI_REGEX)?.[0] : undefined;
      if (imei || serial || pathImei) {
        return {
          raw: value,
          kind: imei || pathImei ? 'imei' : 'serial',
          imei: imei || pathImei,
          serial,
          url: value,
        };
      }
      return { raw: value, kind: 'url', url: value };
    } catch {
      // fall through
    }
  }

  // Loose IMEI anywhere in the string
  const anyImei = value.match(IMEI_REGEX)?.[0];
  if (anyImei) return { raw: value, kind: 'imei', imei: anyImei };

  return { raw: value, kind: 'unknown' };
}

/**
 * Validate an IMEI number: must be 15 digits and satisfy the Luhn checksum.
 */
export function isValidIMEI(value: string): boolean {
  const v = (value ?? '').trim();
  if (!/^\d{15}$/.test(v)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let d = parseInt(v[i], 10);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

