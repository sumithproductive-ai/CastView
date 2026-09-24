import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("Missing EMAIL_TOKEN_ENCRYPTION_KEY");
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error(
      "EMAIL_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key",
    );
  }
  return buf;
}

/** Encrypts a token for storage. Output: base64(iv).base64(authTag).base64(ciphertext) */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decryptToken(encrypted: string): string {
  const key = getKey();
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split(".");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted token");
  }
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
