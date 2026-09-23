import { describe, expect, it } from "vitest";
import {
  collectLinkedPageUrls,
  compactSpaces,
  decodeHtmlEntities,
  extractMainSection,
  extractPageId,
  htmlToLines,
  parseAllWarekiDates,
  parseSessionTitle,
  parseTables,
  parseWarekiDate,
  splitByTables,
  stripWarekiDates,
  toHalfWidthAlnum,
} from "./council-html-utils";

describe("decodeHtmlEntities", () => {
  it("名前付き参照と数値参照を両方デコードする", () => {
    expect(decodeHtmlEntities("A&amp;B&nbsp;&#12354;&#x3042;")).toBe(
      "A&B ああ"
    );
  });
});

describe("extractMainSection", () => {
  it("検索窓の後ろから問い合わせ欄の前までを取り出し、scriptは捨てる", () => {
    const html =
      "<script>x</script>ナビ 何をお探しですか？ <p>本文</p> このページに関する お問い合わせ";
    expect(extractMainSection(html)).toBe("何をお探しですか？ <p>本文</p> ");
  });
});

describe("htmlToLines", () => {
  it("brと段落を改行とみなし、全角空白を寄せて空行を捨てる", () => {
    expect(
      htmlToLines("<p>令和5年<br>6月19日</p><p>　</p><span>採　択</span>")
    ).toEqual(["令和5年", "6月19日", "採 択"]);
  });
});

describe("parseTables / splitByTables", () => {
  const html =
    "<h2>1日目：9月9日（水曜日）</h2>" +
    '<table><tr><th>順番</th><th>質問者</th></tr><tr><td>1</td><td>山野　義人<br>（公明党）<a href="/a.pdf">PDF</a></td></tr></table>' +
    "<p>おわり</p>";

  it("表を行×セルに分解し、セル内のリンクも拾う", () => {
    const tables = parseTables(html);
    expect(tables).toHaveLength(1);
    expect(tables[0][1][0].text).toBe("1");
    expect(tables[0][1][1]).toEqual({
      text: "山野 義人\n（公明党）PDF",
      links: ["/a.pdf"],
    });
  });

  it("表とその間のテキストを出現順に返す", () => {
    const segments = splitByTables(html);
    expect(segments.map((s) => s.kind)).toEqual(["text", "table", "text"]);
    expect(segments[0]).toEqual({ kind: "text", text: "1日目：9月9日（水曜日）" });
    expect(segments[2]).toEqual({ kind: "text", text: "おわり" });
  });

  it("表が無いページは表なし・テキスト1つになる", () => {
    expect(parseTables("<p>本文だけ</p>")).toEqual([]);
    expect(splitByTables("<p>本文だけ</p>")).toEqual([
      { kind: "text", text: "本文だけ" },
    ]);
  });
});

describe("collectLinkedPageUrls", () => {
  it("本文中のリンクから、指定の文字列を含む記事ページだけを重複なく集める", () => {
    const html = `ナビ <a href="/kiji0038564/index.html">審査状況と審査結果（令和5年5月～）</a> 何をお探しですか？
      <a href="/kiji0038564/index.html">審査状況と審査結果（令和5年5月～）</a>
      <a href="/kiji0037317/index.html"><span>審査状況と審査結果</span>（令和元年5月～）</a>
      <a href="/kiji0031049/index.html">請願・陳情の提出</a>
      <a href="/list00713.html">審査状況と審査結果の一覧</a>
      このページに関する`;
    expect(
      collectLinkedPageUrls(html, {
        baseUrl: "https://www.joho.tagawa.fukuoka.jp/list00713.html",
        textIncludes: "審査状況と審査結果",
      })
    ).toEqual([
      "https://www.joho.tagawa.fukuoka.jp/kiji0038564/index.html",
      "https://www.joho.tagawa.fukuoka.jp/kiji0037317/index.html",
    ]);
  });
});

describe("parseAllWarekiDates / parseWarekiDate", () => {
  it("令和・平成・元年・H27.9.4 形式を西暦にする", () => {
    expect(parseWarekiDate("令和5年\n6月19日")).toBe("2023-06-19");
    expect(parseWarekiDate("令和元年6月24日")).toBe("2019-06-24");
    expect(parseWarekiDate("平成３１年２月２８日")).toBe("2019-02-28");
    expect(parseWarekiDate("H27.9.4")).toBe("2015-09-04");
    expect(parseWarekiDate("結果なし")).toBeNull();
  });

  it("複数の日付を出現順に返す", () => {
    expect(parseAllWarekiDates("(1)H24.9.4 採択 (2)H24.12.3 不採択")).toEqual(
      ["2012-09-04", "2012-12-03"]
    );
  });

  it("stripWarekiDates は日付だけを改行に置き換える", () => {
    expect(stripWarekiDates("令和８年３月４日採択")).toBe("\n採択");
    expect(stripWarekiDates("(1)H24.9.4 採択")).toBe("(1)\n 採択");
  });
});

describe("parseSessionTitle", () => {
  it("会期キー・会期名・西暦を取り出す", () => {
    expect(
      parseSessionTitle("令和8年（第6回）田川市議会9月定例会一般質問一覧")
    ).toEqual({ key: "r8-6-teirei", name: "令和8年（第6回）9月定例会", year: 2026 });
    expect(
      parseSessionTitle("令和元年（第5回）田川市議会12月定例会一般質問一覧")
    ).toEqual({ key: "r1-5-teirei", name: "令和元年（第5回）12月定例会", year: 2019 });
    expect(
      parseSessionTitle("平成29年（第1回）田川市議会3月定例会一般質問一覧")
    ).toEqual({ key: "h29-1-teirei", name: "平成29年（第1回）3月定例会", year: 2017 });
  });

  it("定例会の形式でなければ null（臨時会のページや会期名以外）", () => {
    expect(parseSessionTitle("臨時会を開催します（令和8年8月10日）")).toBeNull();
    expect(
      parseSessionTitle("令和8年（第5回）田川市議会8月臨時会一般質問一覧")
    ).toBeNull();
  });

  it("全角の数字・括弧でも読み取る", () => {
    expect(
      parseSessionTitle("令和８年（第６回）田川市議会９月定例会一般質問一覧")
    ).toEqual({ key: "r8-6-teirei", name: "令和8年（第6回）9月定例会", year: 2026 });
  });
});

describe("文字列ユーティリティ", () => {
  it("compactSpaces は全角空白も取り除く", () => {
    expect(compactSpaces("山野　義人 ")).toBe("山野義人");
  });

  it("toHalfWidthAlnum は英数字だけを半角にする", () => {
    expect(toHalfWidthAlnum("ＲＳウイルス（第６回）")).toBe("RSウイルス（第6回）");
  });

  it("extractPageId はURLからページIDを取り出す", () => {
    expect(
      extractPageId("https://www.joho.tagawa.fukuoka.jp/kiji0038564/index.html")
    ).toBe("kiji0038564");
  });
});
