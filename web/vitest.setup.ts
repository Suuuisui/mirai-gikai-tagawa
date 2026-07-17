/**
 * Vitest グローバルセットアップ
 *
 * Node.js (v22+) はグローバルの `localStorage` / `sessionStorage` を
 * 実験的機能として提供しているが、`--localstorage-file` を指定しない限り
 * アクセス時に `undefined` を返す。この Node 組み込みのプロパティが
 * 既に globalThis 上に存在していると、vitest の jsdom environment は
 * （既知のキーの上書きにしか介入しないため）jsdom 本来の localStorage 実装で
 * 上書きしない。結果として jsdom 環境のテストで `localStorage` が
 * `undefined` のままになり、CI（Node 20, この機能なし）では再現しない。
 *
 * jsdom 環境でのみ、localStorage が実際に使えるかを確認し、使えない場合は
 * メモリ上の簡易 Storage 実装で補う（ブラウザAPIのテスト環境シム）。
 */
class MemoryStorage implements Storage {
  #store = new Map<string, string>();

  get length(): number {
    return this.#store.size;
  }

  clear(): void {
    this.#store.clear();
  }

  getItem(key: string): string | null {
    return this.#store.has(key) ? (this.#store.get(key) ?? null) : null;
  }

  key(index: number): string | null {
    return Array.from(this.#store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.#store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, String(value));
  }
}

function isLocalStorageUsable(): boolean {
  try {
    // Node組み込みの localStorage が --localstorage-file 未指定だと
    // ここで undefined が返る（例外は投げない）
    return (
      typeof localStorage !== "undefined" &&
      typeof localStorage.setItem === "function"
    );
  } catch {
    return false;
  }
}

// jsdom 環境（`window` が存在する）でのみ対象。node 環境のテストには影響しない。
if (typeof window !== "undefined" && !isLocalStorageUsable()) {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}
