import { describe, expect, it } from "vitest";
import { uuidv5 } from "./uuidv5";

const DNS_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const URL_NAMESPACE = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

describe("uuidv5", () => {
  it("RFC 4122 の既知テストベクタと一致する（DNS namespace, Python標準ライブラリ uuid.uuid5 の出力値で検証済み）", () => {
    expect(uuidv5(DNS_NAMESPACE, "www.example.com")).toBe(
      "2ed6657d-e927-568b-95e1-2665a8aea6a2"
    );
  });

  it("同じ namespace/name には常に同じUUIDを返す（決定的）", () => {
    const a = uuidv5(DNS_NAMESPACE, "www.example.com");
    const b = uuidv5(DNS_NAMESPACE, "www.example.com");
    expect(a).toBe(b);
  });

  it("name が異なれば異なるUUIDを返す", () => {
    const a = uuidv5(DNS_NAMESPACE, "www.example.com");
    const b = uuidv5(DNS_NAMESPACE, "www.other-example.com");
    expect(a).not.toBe(b);
  });

  it("namespace が異なれば異なるUUIDを返す", () => {
    const a = uuidv5(DNS_NAMESPACE, "www.example.com");
    const b = uuidv5(URL_NAMESPACE, "www.example.com");
    expect(a).not.toBe(b);
  });

  it("バージョンビット（先頭が5）とバリアントビット（8,9,a,bのいずれか）が正しく設定される", () => {
    const uuid = uuidv5(DNS_NAMESPACE, "example");
    const [, , third, fourth] = uuid.split("-");
    expect(third[0]).toBe("5");
    expect(["8", "9", "a", "b"]).toContain(fourth[0]);
  });

  it("不正なnamespace文字列にはエラーを投げる", () => {
    expect(() => uuidv5("not-a-uuid", "example")).toThrow();
  });
});
