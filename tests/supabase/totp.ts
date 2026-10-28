import { createHmac } from "node:crypto";

/**
 * テスト用の TOTP（RFC 6238）計算。認証アプリの代わりに、Supabase の enroll が
 * 返す secret から 6 桁コードを作る。依存は増やさず node:crypto だけを使う。
 * 本番コードでは使わない（コードを作るのは利用者の認証アプリ）。
 *
 * Node の型除去でもそのまま読めるよう、型注釈だけの TypeScript で書いてある
 */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** TOTP の標準: 30 秒刻み・6 桁・HMAC-SHA1（認証アプリも Supabase もこれ） */
export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;

/** Base32（RFC 4648）をバイト列に戻す。空白・小文字・パディングは許す */
export function decodeBase32(input: string): Buffer {
  const cleaned = input.replace(/[\s=]/g, "").toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Base32 に使えない文字です: ${char}`);
    }
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
      value &= (1 << bits) - 1;
    }
  }
  return Buffer.from(bytes);
}

/** 時刻（ミリ秒）が属する 30 秒枠の番号 */
export function totpStep(
  timeMs: number = Date.now(),
  stepSeconds: number = TOTP_STEP_SECONDS
): number {
  return Math.floor(timeMs / 1000 / stepSeconds);
}

/** secret（Base32）から、その時刻の TOTP コードを作る */
export function generateTotp(
  secretBase32: string,
  options: { timeMs?: number; stepSeconds?: number; digits?: number } = {}
): string {
  const {
    timeMs = Date.now(),
    stepSeconds = TOTP_STEP_SECONDS,
    digits = TOTP_DIGITS,
  } = options;

  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(totpStep(timeMs, stepSeconds)));

  const hmac = createHmac("sha1", decodeBase32(secretBase32))
    .update(counter)
    .digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];

  return String(binary % 10 ** digits).padStart(digits, "0");
}

/**
 * 指定した枠より後の枠になるまで待つ。
 * Supabase は同じコードの使い回しを拒むことがあるため、同じ枠の中で 2 回目の確認を
 * するテストは、先に次の枠まで待ってからコードを作る。
 * 返り値は待ったあとの枠の番号
 */
export async function waitUntilAfterTotpStep(
  usedStep: number,
  stepSeconds: number = TOTP_STEP_SECONDS
): Promise<number> {
  while (totpStep(Date.now(), stepSeconds) <= usedStep) {
    const msUntilNextStep =
      (usedStep + 1) * stepSeconds * 1000 - Date.now() + 200;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(msUntilNextStep, 100))
    );
  }
  return totpStep(Date.now(), stepSeconds);
}
