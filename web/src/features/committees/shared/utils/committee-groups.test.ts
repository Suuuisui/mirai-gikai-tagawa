import { describe, expect, it } from "vitest";
import type { CommitteeMeetingSummary } from "../types";
import { buildCommitteeGroups, formatPeriodLabel } from "./committee-groups";

function makeMeeting(
  committee_name: string,
  meeting_date: string,
  source_type: "disclosure" | "youtube" = "youtube"
): CommitteeMeetingSummary {
  return {
    id: `${committee_name}-${meeting_date}`,
    committee_name,
    meeting_date,
    title: `${committee_name}（${meeting_date}）`,
    summary: null,
    key_points: [],
    agenda_items: [],
    attendees: [],
    source_type,
    source_note: null,
    youtube_url: null,
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("buildCommitteeGroups", () => {
  it("委員会ごとにまとめ、常任→特別→その他の順に並べる", () => {
    const groups = buildCommitteeGroups([
      makeMeeting("全員協議会", "2026-01-10"),
      makeMeeting("一般廃棄物処理事業特別委員会", "2026-01-11"),
      makeMeeting("総務文教委員会", "2026-01-12"),
    ]);
    expect(groups.map((g) => g.kind)).toEqual(["standing", "special", "other"]);
  });

  it("同じ種別では会議数の多い委員会を先に並べる", () => {
    const groups = buildCommitteeGroups([
      makeMeeting("厚生委員会", "2026-01-10"),
      makeMeeting("総務文教委員会", "2026-01-11"),
      makeMeeting("総務文教委員会", "2026-01-12"),
    ]);
    expect(groups.map((g) => g.committeeName)).toEqual([
      "総務文教委員会",
      "厚生委員会",
    ]);
  });

  it("グループ内の会議は開催日の新しい順に並ぶ", () => {
    const [group] = buildCommitteeGroups([
      makeMeeting("厚生委員会", "2025-06-01"),
      makeMeeting("厚生委員会", "2026-02-01"),
      makeMeeting("厚生委員会", "2025-12-01"),
    ]);
    expect(group.meetings.map((m) => m.meeting_date)).toEqual([
      "2026-02-01",
      "2025-12-01",
      "2025-06-01",
    ]);
  });

  it("開催期間と開示文書の件数を集計する", () => {
    const [group] = buildCommitteeGroups([
      makeMeeting("総務文教委員会", "2021-01-21", "disclosure"),
      makeMeeting("総務文教委員会", "2026-08-04"),
      makeMeeting("総務文教委員会", "2022-03-14", "disclosure"),
    ]);
    expect(group.period).toEqual({ from: "2021-01-21", to: "2026-08-04" });
    expect(group.disclosureCount).toBe(2);
    expect(group.meetings).toHaveLength(3);
  });

  it("未登録の委員会は正式名称をそのまま短縮名にする", () => {
    const [group] = buildCommitteeGroups([
      makeMeeting("架空の特別委員会", "2026-01-10"),
    ]);
    expect(group.shortName).toBe("架空の特別委員会");
    expect(group.kind).toBe("other");
  });

  it("空配列は空のグループ一覧になる", () => {
    expect(buildCommitteeGroups([])).toEqual([]);
  });
});

describe("formatPeriodLabel", () => {
  it("年をまたぐ場合は範囲で表示する", () => {
    expect(formatPeriodLabel({ from: "2021-01-21", to: "2026-08-04" })).toBe(
      "2021〜2026年"
    );
  });

  it("同じ年なら単年で表示する", () => {
    expect(formatPeriodLabel({ from: "2026-01-10", to: "2026-08-04" })).toBe(
      "2026年"
    );
  });
});
