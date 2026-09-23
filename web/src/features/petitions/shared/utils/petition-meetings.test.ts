import type { PetitionRecord } from "@mirai-gikai/shared/council/types";
import { describe, expect, it } from "vitest";
import type { CommitteeMeetingPetitionRef } from "@/features/committees/shared/types";
import {
  lineMentionsPetition,
  matchPetitionMeetings,
  petitionKeyword,
} from "./petition-meetings";

function petition(
  overrides: Partial<PetitionRecord> & { id: string; title: string }
): PetitionRecord {
  return {
    kind: "chinjo",
    number: 2,
    documentUrl: null,
    introducers: [],
    submittedDate: "2025-09-05",
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

function meeting(
  overrides: Partial<CommitteeMeetingPetitionRef> & {
    id: string;
    meeting_date: string;
  }
): CommitteeMeetingPetitionRef {
  return {
    committee_name: "総務文教委員会",
    headline: null,
    agenda_items: [],
    key_points: [],
    ...overrides,
  };
}

const koto = petition({
  id: "chinjo-2",
  title: "田川市高等教育の支援拡充に関する陳情",
  decidedDate: "2025-12-01",
  status: "partial",
  result: "項目1: 不採択、項目2: 採択",
});

describe("petitionKeyword", () => {
  it("定型の語尾を除いた先頭8字を返す", () => {
    expect(petitionKeyword("田川市高等教育の支援拡充に関する陳情")).toBe(
      "田川市高等教育の"
    );
    expect(petitionKeyword("芳ヶ谷川の水質改善を求める請願")).toBe(
      "芳ヶ谷川の水質改"
    );
  });

  it("全角の数字や空白は正規化する", () => {
    expect(petitionKeyword("国道２０１号　バイパスに関する請願")).toBe(
      "国道201号バイ"
    );
  });
});

describe("lineMentionsPetition", () => {
  it("件名そのものを含む行に一致する", () => {
    expect(
      lineMentionsPetition(
        "陳情第2号 田川市高等教育の支援拡充に関する陳情（継続審査）",
        koto
      )
    ).toBe(true);
  });

  it("番号と件名の語を含む行に一致する", () => {
    expect(
      lineMentionsPetition(
        "陳情第2号「田川市高等教育の支援拡充」は結論に至らず継続審査",
        koto
      )
    ).toBe(true);
  });

  it("件名の語と「陳情」を含む行に一致する", () => {
    expect(
      lineMentionsPetition(
        "田川市高等教育の支援拡充を求める陳情は項目ごとに採決した",
        koto
      )
    ).toBe(true);
  });

  it("番号だけ、件名の語だけの行には一致しない", () => {
    expect(lineMentionsPetition("陳情第2号は継続審査となった", koto)).toBe(
      false
    );
    expect(
      lineMentionsPetition("田川市高等教育の充実について質問した", koto)
    ).toBe(false);
  });
});

describe("matchPetitionMeetings", () => {
  const meetings = [
    meeting({
      id: "m-before",
      meeting_date: "2025-06-10",
      agenda_items: ["陳情第2号 田川市高等教育の支援拡充に関する陳情"],
    }),
    meeting({
      id: "m-first",
      meeting_date: "2025-09-16",
      headline: "市長選に非協力の3社を指名外し",
      agenda_items: [
        "陳情第2号 田川市高等教育の支援拡充に関する陳情（継続審査）",
      ],
      key_points: [
        "決算は3億円の黒字となった",
        "陳情第2号は、陳情者への趣旨確認が必要として継続審査とした",
      ],
    }),
    meeting({
      id: "m-plenary",
      meeting_date: "2025-12-01",
      committee_name: "本会議",
      agenda_items: ["日程第17 請願陳情の件"],
    }),
    meeting({
      id: "m-vote",
      meeting_date: "2025-11-14",
      key_points: [
        "10月31日から継続審査の陳情「田川市高等教育の支援拡充に関する陳情」について、項目ごとに採決を行った",
      ],
    }),
    meeting({
      id: "m-after",
      meeting_date: "2026-02-09",
      agenda_items: ["陳情第2号 田川市高等教育の支援拡充に関する陳情"],
    }),
  ];

  it("上程日から結果が出た日までの会議のうち触れているものを古い順に返し、関係する要点を添える", () => {
    const matches = matchPetitionMeetings(koto, meetings);
    expect(matches.map((m) => m.meetingId)).toEqual(["m-first", "m-vote"]);
    // 審査した会議と分かっていれば、番号だけの言及も要点として拾う（無関係な行は拾わない）
    expect(matches[0].notes).toEqual([
      "陳情第2号は、陳情者への趣旨確認が必要として継続審査とした",
    ]);
    expect(matches[1].notes).toHaveLength(1);
  });

  it("審査中のものは結果の日の上限を設けない", () => {
    const open = petition({ ...koto, decidedDate: null, status: "pending" });
    expect(
      matchPetitionMeetings(open, meetings).map((m) => m.meetingId)
    ).toEqual(["m-first", "m-vote", "m-after"]);
  });

  it("触れている会議が無ければ空配列を返す", () => {
    const other = petition({
      id: "x",
      title: "芳ヶ谷川の水質改善を求める請願",
      kind: "seigan",
      number: 1,
    });
    expect(matchPetitionMeetings(other, meetings)).toEqual([]);
  });
});
