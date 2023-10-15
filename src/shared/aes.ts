import * as CryptoJS from 'crypto-js';

const iv = '000102030405060708090A0B0C0D0E0F';
export function encryptAES256(text: string, encryptionKey: string): string {
  const ciphertext = CryptoJS.AES.encrypt(text, encryptionKey, {
    iv: CryptoJS.enc.Hex.parse(iv),
  });
  return ciphertext.toString();
}

export function decryptAES256(
  encryptedText: string,
  encryptionKey: string
): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, encryptionKey, {
      iv: CryptoJS.enc.Hex.parse(iv),
    });
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return null;
  }
}
