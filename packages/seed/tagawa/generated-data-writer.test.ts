import { describe, expect, it } from "vitest";
import {
  type GeneratedDataOptions,
  renderGeneratedData,
} from "./generated-data-writer";

/** constants を足す前の書き出し（petitions / questions の生成データはこの形で作られている） */
function renderLegacy(options: GeneratedDataOptions): string {
  const headerLines = options.header.map((line) => ` * ${line}`).join("\n");
  return `/**
 * 【自動生成】手で編集しないでください。
${headerLines}
 */

import type { ${options.typeName} } from "@mirai-gikai/shared/council/types";

export const ${options.exportName}: readonly ${options.typeName}[] = ${JSON.stringify(
    options.data,
    null,
    2
  )};
`;
}

const BASE: GeneratedDataOptions = {
  relativePath: "web/src/features/example/shared/data/example-data.ts",
  exportName: "EXAMPLES",
  typeName: "ExampleRecord",
  header: [
    "生成コマンド: pnpm --filter @mirai-gikai/seed tagawa:example",
    "出典: 田川市議会 https://example.test/",
    "2件",
  ],
  data: [
    {
      id: "a",
      title: "請願「道路の補修を求める」",
      nested: { n: 1, list: [] },
    },
    {
      id: "b",
      title: 'ダブルクォート " を含む',
      nested: { n: 2, list: ["x"] },
    },
  ],
};

describe("renderGeneratedData", () => {
  it("constants を指定しないときは、従来と1文字も違わないソースを返す", () => {
    expect(renderGeneratedData(BASE)).toBe(renderLegacy(BASE));
    expect(renderGeneratedData({ ...BASE, constants: undefined })).toBe(
      renderLegacy(BASE)
    );
    expect(renderGeneratedData({ ...BASE, constants: {} })).toBe(
      renderLegacy(BASE)
    );
    const empty = { ...BASE, data: [] };
    expect(renderGeneratedData(empty)).toBe(renderLegacy(empty));
  });

  it("ヘッダ・型の import・配列の export を決まった並びで書き出す", () => {
    const source = renderGeneratedData(BASE);
    expect(
      source.startsWith("/**\n * 【自動生成】手で編集しないでください。\n")
    ).toBe(true);
    expect(source).toContain(
      " * 生成コマンド: pnpm --filter @mirai-gikai/seed tagawa:example\n"
    );
    expect(source).toContain(
      'import type { ExampleRecord } from "@mirai-gikai/shared/council/types";\n\nexport const EXAMPLES: readonly ExampleRecord[] = ['
    );
    expect(source.endsWith("];\n")).toBe(true);
  });

  it("constants を指定すると、配列の export の前に文字列定数を並べる", () => {
    const source = renderGeneratedData({
      ...BASE,
      constants: {
        EXAMPLE_CODE: "pn3o7ap8t0jl59z6k3",
        EXAMPLE_LABEL: "ラベル",
      },
    });
    expect(source).toContain(
      'import type { ExampleRecord } from "@mirai-gikai/shared/council/types";\n\nexport const EXAMPLE_CODE = "pn3o7ap8t0jl59z6k3";\n\nexport const EXAMPLE_LABEL = "ラベル";\n\nexport const EXAMPLES: readonly ExampleRecord[] = ['
    );
  });

  it("定数の値は JSON.stringify で文字列リテラルにする（引用符・改行・バックスラッシュをエスケープ）", () => {
    const value = 'a"b\nc\\d';
    const source = renderGeneratedData({
      ...BASE,
      constants: { TRICKY: value },
    });
    expect(source).toContain(`export const TRICKY = ${JSON.stringify(value)};`);
  });

  it("定数名が識別子でなければ例外を投げる（ソースに任意のコードを混ぜない）", () => {
    for (const name of ["", "1ABC", "A-B", "A B", 'A = "x"; export const B']) {
      expect(() =>
        renderGeneratedData({ ...BASE, constants: { [name]: "x" } })
      ).toThrow("識別子ではありません");
    }
  });
});
