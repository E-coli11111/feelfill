import type { Base64File } from '@/src/types';

/**
 * Reads a browser File as an unprefixed Base64 payload.
 *
 * @param file The browser file to read.
 * @returns The Base64 payload without the data URL prefix.
 * @throws If the file cannot be read as a valid data URL.
 */
export async function fileAsBase64(file: File): Promise<Base64File> {
  const type = file.type
  const name = file.name
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to read file as a data URL."));
        return;
      }

      const separatorIndex = reader.result.indexOf(",");

      if (separatorIndex === -1) {
        reject(new Error("Invalid file data URL."));
        return;
      }

      resolve({
        content: reader.result.slice(separatorIndex + 1),
        type,
        name
      });
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file."));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Generates a PKCE code verifier and its corresponding code challenge.
 *
 * @returns An object containing the code verifier and code challenge.
 * @throws If the browser does not support the SubtleCrypto API.
*/
export async function createPkce(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = createRandomBase64Url(64);
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(codeVerifier),
  );

  return {
    codeVerifier,
    codeChallenge: toBase64Url(new Uint8Array(digest)),
  };
}

/**
 * Generates a random byte array and encodes it as unpadded URL-safe Base64.
 *
 * @param byteLength The length of the random byte array to generate.
 * @returns A URL-safe Base64 string without padding.
 * @throws If the browser does not support the SubtleCrypto API.
 */
export function createRandomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

/** 
 * Encodes a byte array as unpadded URL-safe Base64.
 *
 * @param bytes The byte array to encode.
 * @returns A URL-safe Base64 string without padding.
 * @throws If the browser does not support the SubtleCrypto API.
*/
export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}