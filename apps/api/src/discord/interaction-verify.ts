import { createPublicKey, verify } from "node:crypto";

/** SPKI DER prefix for a raw 32-byte Ed25519 public key. */
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/**
 * Verify Discord interaction Ed25519 signature (X-Signature-Ed25519).
 * Body must be the exact raw request bytes as UTF-8 text.
 */
export function verifyDiscordInteractionSignature(input: {
  publicKeyHex: string;
  signatureHex: string;
  timestamp: string;
  rawBody: string;
}): boolean {
  const { publicKeyHex, signatureHex, timestamp, rawBody } = input;
  if (!publicKeyHex || !signatureHex || !timestamp) return false;

  let signature: Buffer;
  let publicKeyRaw: Buffer;
  try {
    signature = Buffer.from(signatureHex, "hex");
    publicKeyRaw = Buffer.from(publicKeyHex, "hex");
  } catch {
    return false;
  }

  if (signature.length !== 64 || publicKeyRaw.length !== 32) return false;

  try {
    const key = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, publicKeyRaw]),
      format: "der",
      type: "spki",
    });
    return verify(null, Buffer.from(timestamp + rawBody), key, signature);
  } catch {
    return false;
  }
}
