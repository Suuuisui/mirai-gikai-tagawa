import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  COVER_COLORS,
  DOT_COLOR,
  ICON_COLOR,
  MIRAI_TEXT,
  MIRAI_TEXT_NOTE,
} from "./cover-colors";

/**
 * 共有画像の配色は、globals.css の値を書き写したもの（Satori は CSS 変数を解決できない）。
 * 配色を変えたとき、片方だけ更新して画面と共有画像の色がずれるのを防ぐ
 */
const css = fs.readFileSync(
  path.resolve(__dirname, "../../../../globals.css"),
  "utf8"
);

/** globals.css のカスタムプロパティ（--color-xxx: #rrggbb;）の値 */
function cssColor(name: string): string {
  const match = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css);
  if (!match) throw new Error(`globals.css に ${name} が見つかりません`);
  return match[1].toLowerCase();
}

/** "#231f1c" → "rgba(35, 31, 28, 0.08)" */
function toRgba(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((start) =>
    Number.parseInt(hex.slice(start, start + 2), 16)
  );
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

describe("議案の共有画像の配色", () => {
  const entries = Object.entries(COVER_COLORS).flatMap(([family, colors]) =>
    colors.map((color, index) => ({
      token: `--color-cover-${family}-${index + 1}`,
      color,
    }))
  );

  for (const { token, color } of entries) {
    it(`${token} は globals.css と同じ値`, () => {
      expect(color).toBe(cssColor(token));
    });
  }

  it("globals.css のカバー背景色トークンと、系統・濃淡の組が過不足なく一致する", () => {
    const tokensInCss = [
      ...css.matchAll(/(--color-cover-[a-z]+-\d+):\s*#[0-9a-fA-F]{6}\s*;/g),
    ].map((match) => match[1]);
    expect(tokensInCss.sort()).toEqual(entries.map((e) => e.token).sort());
  });

  it("本文の文字色は --color-mirai-text と同じ", () => {
    expect(MIRAI_TEXT).toBe(cssColor("--color-mirai-text"));
  });

  it("日付の文字色は --color-mirai-text-note と同じ（画面のカバーの text-mirai-text-note）", () => {
    expect(MIRAI_TEXT_NOTE).toBe(cssColor("--color-mirai-text-note"));
  });

  it("ドットとアイコンの色は、--color-mirai-text の透明度違い", () => {
    const text = cssColor("--color-mirai-text");
    expect(DOT_COLOR).toBe(toRgba(text, 0.08));
    expect(ICON_COLOR).toBe(toRgba(text, 0.15));
  });

  it("ドットの色は globals.css の .bg-cover-dots と同じ", () => {
    const dotsRule = /\.bg-cover-dots::before\s*\{[^}]*\}/.exec(css)?.[0];
    expect(dotsRule).toBeDefined();
    expect(dotsRule).toContain(DOT_COLOR);
  });
});
