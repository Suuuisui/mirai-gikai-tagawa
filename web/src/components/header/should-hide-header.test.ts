import { describe, expect, it } from "vitest";
import {
  HIDE_SCROLL_THRESHOLD,
  SCROLL_DELTA_THRESHOLD,
  shouldHideHeader,
} from "./should-hide-header";

describe("shouldHideHeader", () => {
  it("ページ上部付近では常に表示する", () => {
    expect(shouldHideHeader(0, 50, false)).toBe(false);
    expect(shouldHideHeader(120, 100, true)).toBe(false);
    expect(shouldHideHeader(0, HIDE_SCROLL_THRESHOLD - 1, true)).toBe(false);
  });

  it("しきい値を超えて下スクロールすると隠す", () => {
    expect(shouldHideHeader(200, 300, false)).toBe(true);
  });

  it("上スクロールで再表示する", () => {
    expect(shouldHideHeader(500, 400, true)).toBe(false);
  });

  it("微小な移動では直前の状態を維持する", () => {
    const smallDelta = SCROLL_DELTA_THRESHOLD - 1;
    expect(shouldHideHeader(300, 300 + smallDelta, true)).toBe(true);
    expect(shouldHideHeader(300, 300 - smallDelta, false)).toBe(false);
  });

  it("オーバースクロールの負値は0として扱う", () => {
    expect(shouldHideHeader(-30, 10, true)).toBe(false);
  });
});
