import { describe, expect, it } from "vitest";
import type { CommitteeMeetingListItem } from "../types";
import {
  buildCommitteeGroups,
  committeeGroupHref,
  committeeSectionId,
  findCommitteeGroup,
  formatPeriodLabel,
} from "./committee-groups";

function makeMeeting(
  committee_name: string,
  meeting_date: string,
  source_type: "disclosure" | "youtube" = "youtube"
): CommitteeMeetingListItem {
  return {
    id: `${committee_name}-${meeting_date}`,
    committee_name,
    meeting_date,
    headline: null,
    topics: [],
    source_type,
  };
}

describe("buildCommitteeGroups", () => {
  it("委員会ごとにまとめ、常任→特別→その他の順に並べる", () => {
    const groups = buildCommitteeGroups([
      makeMeeting("全員協議会", "2026-01-10"),
      makeMeeting("一般廃棄物処理業務に関する調査特別委員会", "2026-01-11"),
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

describe("findCommitteeGroup", () => {
  const groups = buildCommitteeGroups([
    makeMeeting("総務文教委員会", "2026-01-12"),
    makeMeeting("厚生委員会", "2026-01-11"),
    makeMeeting("架空の特別委員会", "2026-01-10"),
  ]);

  it("登録済みの委員会は slug で引ける", () => {
    expect(findCommitteeGroup(groups, "somu-bunkyo")?.committeeName).toBe(
      "総務文教委員会"
    );
    expect(findCommitteeGroup(groups, "kosei")?.committeeName).toBe(
      "厚生委員会"
    );
  });

  it("未登録の委員会は委員会名（エンコードされていてもよい）で引ける", () => {
    expect(findCommitteeGroup(groups, "架空の特別委員会")?.committeeName).toBe(
      "架空の特別委員会"
    );
    expect(
      findCommitteeGroup(groups, encodeURIComponent("架空の特別委員会"))
        ?.committeeName
    ).toBe("架空の特別委員会");
  });

  it("会議が1件も無い委員会は、slug が登録済みでも null", () => {
    expect(findCommitteeGroup(groups, "gikai-hokokukai")).toBeNull();
  });

  it("存在しない slug・壊れたエンコードは null", () => {
    expect(findCommitteeGroup(groups, "no-such-committee")).toBeNull();
    expect(findCommitteeGroup(groups, "%E3")).toBeNull();
  });

  it("まとまりが1つも無ければ null", () => {
    expect(findCommitteeGroup([], "kosei")).toBeNull();
  });
});

describe("committeeGroupHref", () => {
  it("登録済みの委員会は slug のパスにする", () => {
    expect(committeeGroupHref("総務文教委員会")).toBe(
      "/committees/group/somu-bunkyo"
    );
  });

  it("未登録の委員会は委員会名をエンコードしたパスにする", () => {
    expect(committeeGroupHref("架空の特別委員会")).toBe(
      `/committees/group/${encodeURIComponent("架空の特別委員会")}`
    );
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

describe("committeeSectionId", () => {
  it("委員会名をURLに使える形にしてアンカーidにする", () => {
    expect(committeeSectionId("厚生委員会")).toBe(
      `committee-${encodeURIComponent("厚生委員会")}`
    );
  });
});
