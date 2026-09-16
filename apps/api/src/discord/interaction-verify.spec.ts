import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyDiscordInteractionSignature } from "./interaction-verify";

function ed25519Pair() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const spki = publicKey.export({ type: "spki", format: "der" });
  // Last 32 bytes of SPKI DER are the raw public key.
  const publicKeyHex = Buffer.from(spki).subarray(-32).toString("hex");
  return { privateKey, publicKeyHex };
}

describe("verifyDiscordInteractionSignature", () => {
  it("accepts a valid Discord-style Ed25519 signature", () => {
    const { privateKey, publicKeyHex } = ed25519Pair();
    const timestamp = "1710000000";
    const rawBody = '{"type":1}';
    const signatureHex = sign(null, Buffer.from(timestamp + rawBody), privateKey).toString(
      "hex",
    );

    expect(
      verifyDiscordInteractionSignature({
        publicKeyHex,
        signatureHex,
        timestamp,
        rawBody,
      }),
    ).toBe(true);
  });

  it("rejects a tampered body", () => {
    const { privateKey, publicKeyHex } = ed25519Pair();
    const timestamp = "1710000000";
    const rawBody = '{"type":1}';
    const signatureHex = sign(null, Buffer.from(timestamp + rawBody), privateKey).toString(
      "hex",
    );

    expect(
      verifyDiscordInteractionSignature({
        publicKeyHex,
        signatureHex,
        timestamp,
        rawBody: '{"type":2}',
      }),
    ).toBe(false);
  });

  it("rejects missing or malformed inputs", () => {
    expect(
      verifyDiscordInteractionSignature({
        publicKeyHex: "",
        signatureHex: "aa",
        timestamp: "1",
        rawBody: "{}",
      }),
    ).toBe(false);
  });
});
