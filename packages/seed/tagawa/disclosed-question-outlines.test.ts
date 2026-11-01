import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  type DisclosedQuestionOutlines,
  findDisclosedOutline,
  normalizeMemberName,
} from "./disclosed-question-outlines";

const DISCLOSED: DisclosedQuestionOutlines = {
  "r1-4-teirei": {
    pdf: "11_R0109一般質問要旨.pdf",
    members: [
      {
        memberName: "髙瀨冨士夫",
        format: "一問一答",
        items: [
          {
            title: "防災について",
            points: [{ text: "避難所の運営について問う。", subPoints: [] }],
          },
        ],
      },
    ],
  },
};

describe("normalizeMemberName", () => {
  it("空白と瀨・瀬の違いを無視する", () => {
    expect(normalizeMemberName("髙瀬 冨士夫")).toBe(
      normalizeMemberName("髙瀨冨士夫")
    );
  });
});

describe("findDisclosedOutline", () => {
  it("会期と議員名で要旨を返す", () => {
    expect(
      findDisclosedOutline(DISCLOSED, "r1-4-teirei", "髙瀬 冨士夫")
    ).toEqual({
      format: "一問一答",
      items: DISCLOSED["r1-4-teirei"].members[0].items,
    });
  });

  it("会期か議員が無ければ undefined", () => {
    expect(
      findDisclosedOutline(DISCLOSED, "r1-5-teirei", "髙瀬 冨士夫")
    ).toBeUndefined();
    expect(
      findDisclosedOutline(DISCLOSED, "r1-4-teirei", "佐藤 俊一")
    ).toBeUndefined();
  });

  it("同梱の JSON は全議員に要旨がある", () => {
    const data = JSON.parse(
      readFileSync(
        path.join(import.meta.dirname, "data/disclosed-question-outlines.json"),
        "utf-8"
      )
    ) as DisclosedQuestionOutlines;
    const members = Object.values(data).flatMap((s) => s.members);
    expect(Object.keys(data)).toHaveLength(25);
    expect(
      members.every(
        (m) => m.items.length > 0 && m.items.every((i) => i.points.length > 0)
      )
    ).toBe(true);
  });
});
