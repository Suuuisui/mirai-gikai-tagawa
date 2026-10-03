import { describe, expect, it } from "vitest";
import type { MemberProfile } from "../data/member-profiles";
import type { MemberSummary } from "./aggregate-members";
import { FORMER_MEMBERS_LABEL, groupMembersForList } from "./group-members";

function summary(name: string, latestFaction: string): MemberSummary {
  return {
    name,
    factions: [latestFaction],
    latestFaction,
    counts: { yes: 1, no: 0, absent: 0, not_voting: 0 },
    billCount: 1,
  };
}

const PROFILES: Record<string, MemberProfile> = {
  尾﨑: { fullName: "尾﨑 行人", faction: "清風会", isIncumbent: true },
  佐々木: { fullName: "佐々木 博", faction: "清風会", isIncumbent: true },
  陸田: { fullName: "陸田 孝則", faction: "孔志会", isIncumbent: true },
  世羅: { fullName: "世羅 翔二郎", faction: "翔誠クラブ", isIncumbent: true },
  白石: { fullName: "白石 天一", faction: "孔志会", isIncumbent: false },
};

describe("groupMembersForList", () => {
  it("採決当時の会派ではなく、名簿の現在の会派でまとめる", () => {
    const groups = groupMembersForList(
      [summary("尾﨑", "孔志会"), summary("佐々木", "孔志会")],
      PROFILES
    );
    expect(groups[0].label).toBe("清風会");
    expect(groups[0].members.map((m) => m.name)).toEqual(["尾﨑", "佐々木"]);
  });

  it("元議員と名簿に無い姓は最後の「元議員」にまとめる", () => {
    const groups = groupMembersForList(
      [
        summary("白石", "孔志会"),
        summary("村上", "新風会"),
        summary("陸田", "孔志会"),
      ],
      PROFILES
    );
    const last = groups[groups.length - 1];
    expect(last.label).toBe(FORMER_MEMBERS_LABEL);
    expect(last.members.map((m) => m.name)).toEqual(["白石", "村上"]);
  });

  it("現職で賛否の記録がまだ無い議員も会派に加える", () => {
    const groups = groupMembersForList([summary("陸田", "孔志会")], PROFILES);
    const shosei = groups.find((g) => g.label === "翔誠クラブ");
    expect(shosei?.members).toEqual([]);
    expect(shosei?.membersWithoutVotes).toEqual(["世羅"]);
  });

  it("会派は人数の多い順に並べ、元議員がいなければ元議員の枠を作らない", () => {
    const groups = groupMembersForList(
      [
        summary("尾﨑", "孔志会"),
        summary("佐々木", "孔志会"),
        summary("陸田", "孔志会"),
      ],
      PROFILES
    );
    expect(groups.map((g) => g.label)).toEqual([
      "清風会",
      "孔志会",
      "翔誠クラブ",
    ]);
  });
});
