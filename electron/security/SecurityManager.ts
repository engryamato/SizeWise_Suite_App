/**
 * SecurityManager - Minimal cryptographic helper for Electron desktop
 *
 * Provides symmetric encryption/decryption used by the LicenseManager and other
 * Electron-only modules. This implementation is intentionally self-contained to
 * avoid cross-package dependencies.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { app } from 'electron';

export class SecurityManager {
  // Derive a stable 32-byte key from the application name. In production,
  // use a secure key provisioning flow at build time.
  private getKey(): Buffer {
    const base = `${app.getName()}-security-key`;
    return createHash('sha256').update(base).digest(); // 32 bytes
  }

  // AES-256-GCM with random IV and auth tag
  encrypt(plainText: string): string {
    const key = this.getKey();
    const iv = randomBytes(12); // GCM recommended IV size
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Store as base64: iv || tag || ciphertext
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  decrypt(encoded: string): string {
    const key = this.getKey();
    const data = Buffer.from(encoded, 'base64');
    const iv = data.subarray(0, 12);
    const tag = data.subarray(12, 28);
    const ciphertext = data.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

export default SecurityManager;

