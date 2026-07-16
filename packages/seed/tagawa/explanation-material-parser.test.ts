import { describe, expect, it } from "vitest";
import {
  matchExplanationMaterials,
  parseExplanationLinkText,
  parseLeadingNumberList,
  type MatchTargetBill,
  type ParsedExplanationLink,
} from "./explanation-material-parser";

describe("parseLeadingNumberList", () => {
  it("単一の号数を抽出する", () => {
    expect(parseLeadingNumberList("59号　説明資料")).toEqual([59]);
  });

  it("アンダースコア区切りの委員会名がある形式でも抽出する", () => {
    expect(
      parseLeadingNumberList("1号_総務文教委員会（197.7キロバイト）")
    ).toEqual([1]);
  });

  it("範囲表記（63号、65-71号）を展開する", () => {
    expect(parseLeadingNumberList("63号、65-71号　説明資料")).toEqual([
      63, 65, 66, 67, 68, 69, 70, 71,
    ]);
  });

  it("カンマ区切り（13、14号）を展開する", () => {
    expect(parseLeadingNumberList("13、14号_説明資料")).toEqual([13, 14]);
  });

  it("中点区切り（64号・65号）を展開する", () => {
    expect(parseLeadingNumberList("64号・65号　説明資料")).toEqual([64, 65]);
  });

  it("号をまたぐ範囲表記（55号-57号）を展開する", () => {
    expect(parseLeadingNumberList("55号-57号　説明資料")).toEqual([55, 56, 57]);
  });

  it("全角チルダの範囲表記（16～18号）を展開する", () => {
    expect(parseLeadingNumberList("16～18号説明資料")).toEqual([16, 17, 18]);
  });

  it("「号」を省略した列挙は直後の文脈語（説明資料）があれば抽出する", () => {
    expect(parseLeadingNumberList("35,36,37説明資料")).toEqual([35, 36, 37]);
  });

  it("「号」も文脈語も無い数字は誤検出しない", () => {
    expect(parseLeadingNumberList("補正予算書（3.86メガバイト）")).toEqual([]);
    expect(parseLeadingNumberList("議決結果（PDF：82キロバイト）")).toEqual([]);
    expect(parseLeadingNumberList("3.86メガバイトの何か")).toEqual([]);
  });

  it("先頭が号数リストでない場合は空配列を返す", () => {
    expect(parseLeadingNumberList("議案説明資料（28号）")).toEqual([]);
  });
});

describe("parseExplanationLinkText", () => {
  it("提出者区分つきの明示的なラベルを最優先で抽出する", () => {
    expect(
      parseExplanationLinkText("議員提出議案第16号（68.9キロバイト）")
    ).toEqual({
      fullFormLabels: ["議員提出議案第16号"],
      bareNumbers: [],
    });
    expect(
      parseExplanationLinkText("委員会提出議案第5号（61.5キロバイト）")
    ).toEqual({
      fullFormLabels: ["委員会提出議案第5号"],
      bareNumbers: [],
    });
  });

  it("空白入りの表記ゆれ（議員提出議案 第2号）も抽出する", () => {
    expect(
      parseExplanationLinkText("議員提出議案 第2号 （126.7キロバイト）")
    ).toEqual({
      fullFormLabels: ["議員提出議案第2号"],
      bareNumbers: [],
    });
  });

  it("「議案」を省略した表記ゆれ（議員提出第19号）を正式名に正規化する", () => {
    expect(
      parseExplanationLinkText("議員提出第19号（PDF：187.7キロバイト）")
    ).toEqual({
      fullFormLabels: ["議員提出議案第19号"],
      bareNumbers: [],
    });
  });

  it("「第」が無い明示的ラベルも抽出する（諮問1号 等）", () => {
    expect(parseExplanationLinkText("諮問1号（38.3キロバイト）")).toEqual({
      fullFormLabels: ["諮問第1号"],
      bareNumbers: [],
    });
  });

  it("議案第N号がPDFサイズ表記の前にあっても抽出する", () => {
    expect(
      parseExplanationLinkText("議案第33号（PDF：64.8キロバイト）")
    ).toEqual({
      fullFormLabels: ["議案第33号"],
      bareNumbers: [],
    });
  });

  it("種別プレフィックスつきの範囲表記（議案第62～67号）を展開する", () => {
    expect(
      parseExplanationLinkText(
        "議案第62～67号_説明資料（PDF：783.8キロバイト）"
      )
    ).toEqual({
      fullFormLabels: [
        "議案第62号",
        "議案第63号",
        "議案第64号",
        "議案第65号",
        "議案第66号",
        "議案第67号",
      ],
      bareNumbers: [],
    });
  });

  it("種別プレフィックスつきの複合リスト（議案第59-62,68号）を展開する", () => {
    expect(
      parseExplanationLinkText(
        "議案第59-62,68号説明資料(1)（PDF：512.6キロバイト）"
      )
    ).toEqual({
      fullFormLabels: [
        "議案第59号",
        "議案第60号",
        "議案第61号",
        "議案第62号",
        "議案第68号",
      ],
      bareNumbers: [],
    });
  });

  it("「号」を省略したプレフィックスつき表記（議案第76‐77説明資料）も展開する", () => {
    expect(
      parseExplanationLinkText("議案第76‐77説明資料（PDF：471.3キロバイト）")
    ).toEqual({
      fullFormLabels: ["議案第76号", "議案第77号"],
      bareNumbers: [],
    });
  });

  it("「第」始まりの範囲表記（第69-72、74、75号）を抽出する", () => {
    expect(
      parseExplanationLinkText(
        "第69-72、74、75号説明資料（PDF：2.31メガバイト）"
      )
    ).toEqual({
      fullFormLabels: [],
      bareNumbers: [69, 70, 71, 72, 74, 75],
    });
  });

  it("括弧内の号数（議案説明資料（28号）等）を抽出する", () => {
    expect(
      parseExplanationLinkText("議案説明資料（28号）（PDF：438.7キロバイト）")
    ).toEqual({
      fullFormLabels: [],
      bareNumbers: [28],
    });
  });

  it("複数号のまとめ資料を範囲展開する", () => {
    expect(parseExplanationLinkText("63号、65-71号　説明資料")).toEqual({
      fullFormLabels: [],
      bareNumbers: [63, 65, 66, 67, 68, 69, 70, 71],
    });
  });

  it("文中の相互参照ではなく先頭の号数をリンクの主対象として扱う", () => {
    expect(
      parseExplanationLinkText(
        "2号 説明資料 （951.9キロバイト） 予算書は議案第1号を参照"
      )
    ).toEqual({
      fullFormLabels: [],
      bareNumbers: [2],
    });
  });

  it("号数を抽出できないテキストは空の結果を返す", () => {
    expect(parseExplanationLinkText("補正予算書（3.86メガバイト）")).toEqual({
      fullFormLabels: [],
      bareNumbers: [],
    });
    expect(
      parseExplanationLinkText("市長の退職の期日に関する同意について")
    ).toEqual({
      fullFormLabels: [],
      bareNumbers: [],
    });
  });
});

function link(
  label: string,
  parsed: ParsedExplanationLink,
  url = `https://example.com/${label}.pdf`
) {
  return { label, url, parsed };
}

function fullForm(...labels: string[]): ParsedExplanationLink {
  return { fullFormLabels: labels, bareNumbers: [] };
}

function bare(...numbers: number[]): ParsedExplanationLink {
  return { fullFormLabels: [], bareNumbers: numbers };
}

function bills(
  ...entries: Array<[string, MatchTargetBill["proposer"]]>
): MatchTargetBill[] {
  return entries.map(([billNumberLabel, proposer]) => ({
    // テストでは「ラベル:提出者」を議案の識別キーとして使う
    id: `${billNumberLabel}:${proposer}`,
    billNumberLabel,
    proposer,
  }));
}

describe("matchExplanationMaterials", () => {
  it("明示的ラベルをそのまま突合する", () => {
    const { matched, unmatched } = matchExplanationMaterials(
      [link("議員提出議案第16号", fullForm("議員提出議案第16号"))],
      bills(["議員提出議案第16号", "member"], ["議案第59号", "mayor"])
    );
    expect(matched.get("議員提出議案第16号:member")).toEqual([
      {
        label: "議員提出議案第16号",
        url: "https://example.com/議員提出議案第16号.pdf",
      },
    ]);
    expect(unmatched).toEqual([]);
  });

  it("提出者区分つきラベルは、proposerが一致する議案第N号にフォールバックする", () => {
    const { matched, unmatched } = matchExplanationMaterials(
      [link("委員会提出議案第5号", fullForm("委員会提出議案第5号"))],
      bills(["議案第5号", "committee"])
    );
    expect(matched.get("議案第5号:committee")).toEqual([
      {
        label: "委員会提出議案第5号",
        url: "https://example.com/委員会提出議案第5号.pdf",
      },
    ]);
    expect(unmatched).toEqual([]);
  });

  it("提出者区分が一致しない議案第N号にはフォールバックしない", () => {
    const { matched, unmatched } = matchExplanationMaterials(
      [link("議員提出議案第19号", fullForm("議員提出議案第19号"))],
      bills(["議案第19号", "mayor"])
    );
    expect(matched.size).toBe(0);
    expect(unmatched).toEqual([
      {
        label: "議員提出議案第19号",
        url: "https://example.com/議員提出議案第19号.pdf",
        reason: "該当する議案が見つかりません: 議員提出議案第19号",
      },
    ]);
  });

  it("同一ラベルに市長提出と議員提出が並存する場合、表記から提出者を判別して割り当てる", () => {
    // 令和7年9月定例会の実例: 市長提出「議案第44号」（条例改正）と
    // 議員提出「議案第44号」（決議）が同じラベルで並存する
    const { matched, unmatched } = matchExplanationMaterials(
      [
        link(
          "議員提出議案第44号",
          fullForm("議員提出議案第44号"),
          "https://example.com/member44.pdf"
        ),
        link("44号説明資料", bare(44), "https://example.com/mayor44.pdf"),
      ],
      bills(["議案第44号", "member"], ["議案第44号", "mayor"])
    );
    expect(matched.get("議案第44号:member")).toEqual([
      { label: "議員提出議案第44号", url: "https://example.com/member44.pdf" },
    ]);
    expect(matched.get("議案第44号:mayor")).toEqual([
      { label: "44号説明資料", url: "https://example.com/mayor44.pdf" },
    ]);
    expect(unmatched).toEqual([]);
  });

  it("明示的な「議案第N号」リンクは同一ラベルの中で市長提出分を優先する", () => {
    const { matched } = matchExplanationMaterials(
      [link("議案第50号", fullForm("議案第50号"))],
      bills(["議案第50号", "member"], ["議案第50号", "mayor"])
    );
    expect(matched.get("議案第50号:mayor")).toHaveLength(1);
    expect(matched.get("議案第50号:member")).toBeUndefined();
  });

  it("号数のみの表記は議案第N号を優先して突合する", () => {
    const { matched } = matchExplanationMaterials(
      [link("59号 説明資料", bare(59))],
      bills(["議案第59号", "mayor"])
    );
    expect(matched.get("議案第59号:mayor")).toHaveLength(1);
  });

  it("同一議案に複数PDFがある場合は配列で保持する（号数のみの表記）", () => {
    const { matched, unmatched } = matchExplanationMaterials(
      [
        link("60号 厚生委員会", bare(60), "https://example.com/60-kosei.pdf"),
        link(
          "60号 建設経済委員会",
          bare(60),
          "https://example.com/60-kensetsu.pdf"
        ),
      ],
      bills(["議案第60号", "mayor"])
    );
    expect(matched.get("議案第60号:mayor")).toEqual([
      { label: "60号 厚生委員会", url: "https://example.com/60-kosei.pdf" },
      {
        label: "60号 建設経済委員会",
        url: "https://example.com/60-kensetsu.pdf",
      },
    ]);
    expect(unmatched).toEqual([]);
  });

  it("同一議案に複数PDFがある場合は配列で保持する（明示的ラベル）", () => {
    const { matched, unmatched } = matchExplanationMaterials(
      [
        link(
          "認定第1号_厚生委員会説明資料",
          fullForm("認定第1号"),
          "https://example.com/n1-kosei.pdf"
        ),
        link(
          "認定第1号_建設経済委員会説明資料",
          fullForm("認定第1号"),
          "https://example.com/n1-kensetsu.pdf"
        ),
      ],
      bills(["認定第1号", "mayor"])
    );
    expect(matched.get("認定第1号:mayor")).toEqual([
      {
        label: "認定第1号_厚生委員会説明資料",
        url: "https://example.com/n1-kosei.pdf",
      },
      {
        label: "認定第1号_建設経済委員会説明資料",
        url: "https://example.com/n1-kensetsu.pdf",
      },
    ]);
    expect(unmatched).toEqual([]);
  });

  it("明示的ラベルが確保した議案は号数のみの表記の候補から除外する（議案第7号 vs 認定第7号）", () => {
    const { matched, unmatched } = matchExplanationMaterials(
      [
        link("委員会提出議案第7号", fullForm("委員会提出議案第7号")),
        link("7号 説明資料", bare(7)),
      ],
      bills(["議案第7号", "committee"], ["認定第7号", "mayor"])
    );
    expect(matched.get("議案第7号:committee")).toEqual([
      {
        label: "委員会提出議案第7号",
        url: "https://example.com/委員会提出議案第7号.pdf",
      },
    ]);
    expect(matched.get("認定第7号:mayor")).toEqual([
      { label: "7号 説明資料", url: "https://example.com/7号 説明資料.pdf" },
    ]);
    expect(unmatched).toEqual([]);
  });

  it("同じ号数のbareリンクが複数あっても同一議案に追記する（複数種別があるページ）", () => {
    // 決算（認定第1号）の委員会別資料が3つ並ぶページ。諮問第1号にも
    // 同じ号数があるが、優先順位により3つとも認定第1号へ紐付ける
    const { matched, unmatched } = matchExplanationMaterials(
      [
        link("1号 総務文教委員会", bare(1), "https://example.com/1-soubun.pdf"),
        link("1号 厚生委員会", bare(1), "https://example.com/1-kosei.pdf"),
        link(
          "1号 建設経済委員会",
          bare(1),
          "https://example.com/1-kensetsu.pdf"
        ),
      ],
      bills(["認定第1号", "mayor"], ["諮問第1号", "mayor"])
    );
    expect(matched.get("認定第1号:mayor")).toHaveLength(3);
    expect(matched.get("諮問第1号:mayor")).toBeUndefined();
    // 3件とも曖昧さの警告が出る
    expect(unmatched).toHaveLength(3);
    for (const u of unmatched) {
      expect(u.reason).toContain("複数の議案が候補になり得ます");
      expect(u.reason).toContain("認定第1号に割り当てました");
    }
  });

  it("複数号のまとめ資料は展開後の全ての議案に同一PDFを紐付ける", () => {
    const { matched } = matchExplanationMaterials(
      [link("63号、65-71号 説明資料", bare(63, 65, 66, 67, 68, 69, 70, 71))],
      bills(
        ["議案第63号", "mayor"],
        ["議案第65号", "mayor"],
        ["議案第66号", "mayor"],
        ["議案第67号", "mayor"],
        ["議案第68号", "mayor"],
        ["議案第69号", "mayor"],
        ["議案第70号", "mayor"],
        ["議案第71号", "mayor"]
      )
    );
    for (const n of [63, 65, 66, 67, 68, 69, 70, 71]) {
      expect(matched.get(`議案第${n}号:mayor`)).toHaveLength(1);
    }
  });

  it("議案番号を抽出できないリンクはunmatchedに理由つきで記録する", () => {
    const { matched, unmatched } = matchExplanationMaterials(
      [link("補正予算書", bare())],
      bills(["議案第1号", "mayor"])
    );
    expect(matched.size).toBe(0);
    expect(unmatched).toEqual([
      {
        label: "補正予算書",
        url: "https://example.com/補正予算書.pdf",
        reason: "リンクテキストから議案番号を抽出できませんでした",
      },
    ]);
  });

  it("号数に該当する議案が存在しない場合はunmatchedに記録する", () => {
    const { unmatched } = matchExplanationMaterials(
      [link("99号 説明資料", bare(99))],
      bills(["議案第1号", "mayor"])
    );
    expect(unmatched).toEqual([
      {
        label: "99号 説明資料",
        url: "https://example.com/99号 説明資料.pdf",
        reason: "該当する議案が見つかりません（99号）",
      },
    ]);
  });
});
