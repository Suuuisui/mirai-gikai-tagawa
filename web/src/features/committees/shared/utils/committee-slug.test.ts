import { describe, expect, it } from "vitest";
import { routes } from "@/lib/routes";
import { COMMITTEE_PROFILES } from "../data/committee-profiles";
import { getCommitteeSlug, resolveCommitteeName } from "./committee-slug";

const registeredNames = Object.keys(COMMITTEE_PROFILES);
const registeredSlugs = Object.values(COMMITTEE_PROFILES).map(
  (profile) => profile.slug
);

describe("登録済みの委員会の slug", () => {
  it("すべてちがう（URLが重ならない）", () => {
    expect(new Set(registeredSlugs).size).toBe(registeredSlugs.length);
  });

  it("半角の小文字・数字・ハイフンだけで、ハイフンで始まらず終わらない", () => {
    for (const slug of registeredSlugs) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(slug.startsWith("-")).toBe(false);
      expect(slug.endsWith("-")).toBe(false);
    }
  });

  it("主な委員会の slug は決めたとおり（公開後に変えるとURLが変わる）", () => {
    expect(getCommitteeSlug("総務文教委員会")).toBe("somu-bunkyo");
    expect(getCommitteeSlug("厚生委員会")).toBe("kosei");
    expect(getCommitteeSlug("建設経済委員会")).toBe("kensetsu-keizai");
    expect(getCommitteeSlug("議会運営委員会")).toBe("gikai-unei");
    expect(getCommitteeSlug("本会議")).toBe("honkaigi");
    expect(getCommitteeSlug("本会議（一般質問）")).toBe("ippan-shitsumon");
    expect(getCommitteeSlug("全員協議会")).toBe("zenin-kyogikai");
    expect(getCommitteeSlug("議会報告会")).toBe("gikai-hokokukai");
  });
});

describe("getCommitteeSlug", () => {
  it("未登録の委員会は委員会名そのものを返す", () => {
    expect(getCommitteeSlug("架空の特別委員会")).toBe("架空の特別委員会");
  });
});

describe("resolveCommitteeName", () => {
  it("全プロフィールで slug から委員会名に往復できる", () => {
    for (const committeeName of registeredNames) {
      expect(
        resolveCommitteeName(getCommitteeSlug(committeeName), registeredNames)
      ).toBe(committeeName);
    }
  });

  it("slug が一致すれば、会議の一覧に委員会名が無くても委員会名を返す", () => {
    // 会議が 0 件かどうかは呼び出し側（委員会ごとのページ）が見て 404 にする
    expect(resolveCommitteeName("kosei", [])).toBe("厚生委員会");
  });

  it("未登録の委員会名（日本語）も往復できる", () => {
    const names = ["架空の特別委員会"];
    const slug = getCommitteeSlug("架空の特別委員会");
    expect(resolveCommitteeName(slug, names)).toBe("架空の特別委員会");
  });

  it("パーセントエンコードされたパラメータも戻して照合する", () => {
    const names = ["架空の特別委員会"];
    expect(
      resolveCommitteeName(encodeURIComponent("架空の特別委員会"), names)
    ).toBe("架空の特別委員会");
    expect(resolveCommitteeName("%6Bosei", [])).toBe("厚生委員会");
  });

  it("登録済みの委員会は、委員会名のURLでも開ける（slug を足す前に共有されたURLのため）", () => {
    expect(resolveCommitteeName("厚生委員会", registeredNames)).toBe(
      "厚生委員会"
    );
    expect(
      resolveCommitteeName(encodeURIComponent("厚生委員会"), registeredNames)
    ).toBe("厚生委員会");
  });

  it("未登録の委員会名に / ? # % や空白が入っていても、URLにして戻せる", () => {
    const names = [
      "A/B特別委員会",
      "なぜ?委員会",
      "第1#委員会",
      "100%委員会",
      "空白 あり委員会",
    ];
    for (const name of names) {
      const path = routes.committeeGroup(getCommitteeSlug(name));
      // 名前の中の「/」はエンコードされ、パスの区切りを増やさない
      expect(path.split("/")).toHaveLength(4);
      const lastSegment = path.split("/").pop() ?? "";
      expect(resolveCommitteeName(lastSegment, names)).toBe(name);
    }
  });

  it("実在しない委員会名は null", () => {
    expect(resolveCommitteeName("架空の特別委員会", ["厚生委員会"])).toBeNull();
  });

  it("未知の slug は null", () => {
    expect(
      resolveCommitteeName("unknown-committee", registeredNames)
    ).toBeNull();
    expect(resolveCommitteeName("", registeredNames)).toBeNull();
  });

  it("大文字など、slug と完全に一致しないものは null", () => {
    expect(resolveCommitteeName("KOSEI", registeredNames)).toBeNull();
    expect(resolveCommitteeName("kosei/", registeredNames)).toBeNull();
  });

  it("壊れたエンコード（decodeURIComponent が投げるもの）でも落ちずに null", () => {
    expect(() => resolveCommitteeName("%E3", registeredNames)).not.toThrow();
    expect(resolveCommitteeName("%E3", registeredNames)).toBeNull();
    expect(resolveCommitteeName("%", registeredNames)).toBeNull();
    expect(resolveCommitteeName("%E3%81", registeredNames)).toBeNull();
  });
});
