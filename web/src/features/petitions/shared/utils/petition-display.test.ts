import type { PetitionRecord } from "@mirai-gikai/shared/council/types";
import { describe, expect, it } from "vitest";
import {
  formatPetitionOutcome,
  isPetitionOpen,
  selectPetitionsForSession,
  splitPetitionsByOpen,
  summarizePetitions,
} from "./petition-display";

function petition(
  overrides: Partial<PetitionRecord> & { id: string; submittedDate: string }
): PetitionRecord {
  return {
    kind: "chinjo",
    number: 1,
    title: overrides.id,
    documentUrl: null,
    introducers: [],
    committees: ["総務文教委員会"],
    decidedDate: null,
    status: "pending",
    result: null,
    measure: null,
    sourceUrl: "https://example.com",
    sourceTitle: "審査状況と審査結果",
    ...overrides,
  };
}

const pending = petition({ id: "p1", submittedDate: "2026-09-07" });
const continued = petition({
  id: "p2",
  submittedDate: "2026-03-04",
  status: "continued",
  result: "継続審査",
  decidedDate: "2026-09-07",
  kind: "seigan",
});
const adopted = petition({
  id: "p3",
  submittedDate: "2025-12-01",
  status: "adopted",
  result: "採択",
  measure: "執行部送付",
  decidedDate: "2026-03-04",
  kind: "seigan",
});
const partial = petition({
  id: "p4",
  submittedDate: "2025-09-05",
  status: "partial",
  result: "項目1: 不採択、項目2: 採択",
  measure: "執行部送付",
  decidedDate: "2025-12-01",
});
const rejected = petition({
  id: "p5",
  submittedDate: "2022-02-24",
  status: "rejected",
  result: "不採択",
  decidedDate: "2022-03-24",
});

describe("summarizePetitions", () => {
  it("種別・審査中・採択（一部採択を含む）の件数を数える", () => {
    expect(
      summarizePetitions([pending, continued, adopted, partial, rejected])
    ).toEqual({
      total: 5,
      seigan: 2,
      chinjo: 3,
      open: 2,
      adopted: 2,
    });
  });
});

describe("splitPetitionsByOpen / isPetitionOpen", () => {
  it("審査中と継続審査を先頭グループにし、それぞれ上程日の新しい順にする", () => {
    const { open, closed } = splitPetitionsByOpen([
      rejected,
      adopted,
      pending,
      partial,
      continued,
    ]);
    expect(open.map((p) => p.id)).toEqual(["p1", "p2"]);
    expect(closed.map((p) => p.id)).toEqual(["p3", "p4", "p5"]);
    expect(isPetitionOpen(adopted)).toBe(false);
  });
});

describe("selectPetitionsForSession", () => {
  const session = { start_date: "2026-09-07", end_date: "2026-10-08" };

  it("会期中に上程または議決されたものを新しい順に返す", () => {
    expect(
      selectPetitionsForSession(
        [rejected, adopted, pending, continued],
        session
      ).map((p) => p.id)
    ).toEqual(["p1", "p2"]);
  });

  it("会期の初日・最終日に当たる日付も含める", () => {
    const onStart = petition({ id: "s", submittedDate: "2026-09-07" });
    const onEnd = petition({
      id: "e",
      submittedDate: "2026-01-01",
      decidedDate: "2026-10-08",
      status: "adopted",
    });
    const outside = petition({ id: "o", submittedDate: "2026-10-09" });
    expect(
      selectPetitionsForSession([onStart, onEnd, outside], session).map(
        (p) => p.id
      )
    ).toEqual(["s", "e"]);
  });
});

describe("formatPetitionOutcome", () => {
  it("結果に措置を添え、結果の記載が無ければ分類の表示名を使う", () => {
    expect(formatPetitionOutcome(adopted)).toBe("採択（執行部送付）");
    expect(formatPetitionOutcome(rejected)).toBe("不採択");
    expect(formatPetitionOutcome(pending)).toBe("審査中");
    expect(
      formatPetitionOutcome({
        status: "adopted",
        result: null,
        measure: "意見書提出",
      })
    ).toBe("採択（意見書提出）");
  });
});
