/**
 * RFC 4122 version 5 UUID 生成（決定的ID採番用）
 *
 * 名前空間UUID + 名前文字列から SHA-1 ベースで決定的にUUIDを生成する純粋関数。
 * 同じ namespace/name の組に対して常に同じUUIDを返すため、build-csv.ts で
 * `randomUUID()` の代わりに使うことで、再シード（全消し→再投入）のたびに
 * bill_id / diet_session_id 等が変わってしまう問題（`/bills/{id}` のURLが
 * 毎回変わる）を解消する。
 *
 * 外部パッケージ（uuid等）には依存せず node:crypto の createHash のみで実装する。
 */

import { createHash } from "node:crypto";

function parseUuid(uuid: string): Buffer {
  const hex = uuid.replace(/-/g, "");
  if (hex.length !== 32 || /[^0-9a-fA-F]/.test(hex)) {
    throw new Error(`Invalid UUID string: ${uuid}`);
  }
  return Buffer.from(hex, "hex");
}

function formatUuid(bytes: Buffer): string {
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/**
 * @param namespace ハイフン区切り表記のUUID文字列（例: DNS namespace
 *   `6ba7b810-9dad-11d1-80b4-00c04fd430c8`、またはプロジェクト固有の定数）
 * @param name 名前空間内で一意な名前文字列
 * @returns RFC 4122 version 5 のUUID文字列（ハイフン区切り・小文字）
 */
export function uuidv5(namespace: string, name: string): string {
  const namespaceBytes = parseUuid(namespace);
  const nameBytes = Buffer.from(name, "utf-8");

  const hash = createHash("sha1")
    .update(namespaceBytes)
    .update(nameBytes)
    .digest();

  const bytes = Buffer.from(hash.subarray(0, 16));
  // version 5: 上位4bitを 0101 に設定
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  // variant RFC4122: 上位2bitを 10 に設定
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  return formatUuid(bytes);
}
