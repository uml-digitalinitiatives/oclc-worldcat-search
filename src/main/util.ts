/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { createURLRoute } from 'electron-router-dom';
import { getRandomValues, subtle } from 'crypto';

export function resolveHtmlPath(htmlFileName: string, route_id: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return createURLRoute(
      url.href,
      route_id
    );
  }
  return createURLRoute(
    `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`,
    route_id
  );
}

/**
 * Convert a decimal number to a hex string.
 * @param dec The decimal number to convert.
 * @returns The hex string.
 */
function dec2hex(dec: number) {
  const hex = '0' + dec.toString(16);
  return hex.substring(hex.length-2);
}

/**
 * @returns A random string of hex characters.
 */
export function generateRandomString(): string {
  let array = new Uint32Array(56/2);
  getRandomValues(array);
  return Array.from(array, dec2hex).join('');
}

/**
 * Generate a sha256 hash of a string.
 * @param plain The string to hash.
 * @returns The hash of the string.
 */
function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return subtle.digest('SHA-256', data);
}

/**
 * URL encode a base64 string.
 * @param buffer The buffer to encode.
 * @returns The encoded string.
 */
function base64urlencode(buffer: ArrayBuffer) {
  let str = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(str, 'binary').toString('base64')
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generate a challenge from a verifier.
 * @param verifer The verifier to generate a challenge from.
 * @returns The base64 encoded challenge.
 */
export async function challenge_from_verifier(verifer: string): Promise<string> {
  return await sha256(verifer).then((buffer) => {return base64urlencode(buffer);}).catch((error) => {throw error;});
}
