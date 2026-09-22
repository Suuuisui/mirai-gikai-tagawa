import { describe, expect, it } from "vitest";
import {
  mergeQuestionPages,
  parseQuestionItems,
  parseQuestionPage,
  parseQuestioner,
} from "./question-parser";

const PAGE_URL = "https://www.joho.tagawa.fukuoka.jp/kiji00311956/index.html";

function page(title: string, body: string): string {
  return `<html><head><title>${title} / 福岡県田川市</title></head><body>何をお探しですか？<h1>${title}</h1>${body}このページに関する お問い合わせ</body></html>`;
}

describe("parseQuestionPage", () => {
  it("日ごとの表から順番・質問者・会派・質問事項・質問日を読み取る", () => {
    const html = page(
      "令和8年（第6回）田川市議会9月定例会一般質問一覧",
      `<p>9月9日（水曜日）、10日（木曜日）に一般質問が行われます</p>
<p>1日目：9月9日（水曜日）10時から</p>
<table><tr><th>順番</th><th>質問者</th><th>質問事項</th></tr>
<tr><td>1</td><td>山野　義人<br>（公明党）</td><td>１　ＲＳウイルス感染症の予防対策について</td></tr></table>
<p>2日目：9月10日（木曜日）10時から</p>
<table><tr><th>順番</th><th>質問者</th><th>質問事項</th></tr>
<tr><td>６</td><td>石松　和幸</td><td>１　交通空白解消に向けた取組について<br>２　平成筑豊鉄道沿線地域公共交通協議会<br>（法定協議会）について</td></tr></table>
<p><a href="/kiji00311956/3_11956_55720_up_43zx8332.pdf">令和８年９月定例会一般質問（PDF：232.2キロバイト）</a></p>`
    );
    const parsed = parseQuestionPage(html, PAGE_URL);
    expect(parsed?.session).toEqual({
      key: "r8-6-teirei",
      name: "令和8年（第6回）9月定例会",
      year: 2026,
    });
    expect(parsed?.deferred).toBe(false);
    expect(parsed?.pdfUrl).toBe(
      "https://www.joho.tagawa.fukuoka.jp/kiji00311956/3_11956_55720_up_43zx8332.pdf"
    );
    expect(parsed?.records).toEqual([
      {
        id: "r8-6-teirei-1",
        sessionKey: "r8-6-teirei",
        sessionName: "令和8年（第6回）9月定例会",
        questionDate: "2026-09-09",
        dayIndex: 1,
        order: 1,
        memberName: "山野 義人",
        familyName: "山野",
        faction: "公明党",
        isRepresentative: true,
        items: ["RSウイルス感染症の予防対策について"],
        sourceUrl: PAGE_URL,
        pdfUrl:
          "https://www.joho.tagawa.fukuoka.jp/kiji00311956/3_11956_55720_up_43zx8332.pdf",
      },
      {
        id: "r8-6-teirei-6",
        sessionKey: "r8-6-teirei",
        sessionName: "令和8年（第6回）9月定例会",
        questionDate: "2026-09-10",
        dayIndex: 2,
        order: 6,
        memberName: "石松 和幸",
        familyName: "石松",
        faction: null,
        isRepresentative: false,
        items: [
          "交通空白解消に向けた取組について",
          "平成筑豊鉄道沿線地域公共交通協議会（法定協議会）について",
        ],
        sourceUrl: PAGE_URL,
        pdfUrl:
          "https://www.joho.tagawa.fukuoka.jp/kiji00311956/3_11956_55720_up_43zx8332.pdf",
      },
    ]);
  });

  it("古いページの表内にある日付行から質問日を決める", () => {
    const html = page(
      "平成29年（第1回）田川市議会3月定例会一般質問一覧",
      `<p>3月定例会の一般質問は 3月2日（木曜日）、3日（金曜日）の 2日間で行われます。</p>
<table><tr><th>順番</th><th>質　問　者</th><th>質　問　事　項</th></tr>
<tr><td>1日目</td><td>3月2日（木曜日）</td><td>本会議は10時から開催しますが、採決後に一般質問を行います</td></tr>
<tr><td>1</td><td>植木　康太<br>（リベラル）</td><td>1　公共下水道事業について<br>2　交流人口の増加策について</td></tr>
<tr><td>2日目</td><td>3月3日（金曜日） </td><td>10時～</td></tr>
<tr><td>5</td><td>陸田　孝則<br>（孔志会）</td><td>1　平成29年度市政所信について</td></tr></table>`
    );
    const records = parseQuestionPage(html, PAGE_URL)?.records ?? [];
    expect(records.map((r) => [r.order, r.dayIndex, r.questionDate])).toEqual([
      [1, 1, "2017-03-02"],
      [5, 2, "2017-03-03"],
    ]);
    expect(records[0].memberName).toBe("植木 康太");
  });

  it("延期分ページは開始時刻付きの日付から質問日を決め、deferred になる", () => {
    const html = page(
      "令和2年（第1回）田川市議会3月定例会一般質問一覧 （延期分）",
      `<p>3月定例会の一般質問（延期分）は 3月9日（月曜日）に行われます</p>
<p>3月9日（月曜日）<br>10時～</p>
<table><tr><th>順番</th><th>質　問　者</th><th>質　問　事　項</th></tr>
<tr><td>5</td><td>佐藤　俊一</td><td>1　買い物弱者対策の取り組みについて</td></tr></table>`
    );
    const parsed = parseQuestionPage(html, PAGE_URL);
    expect(parsed?.deferred).toBe(true);
    expect(parsed?.records[0].questionDate).toBe("2020-03-09");
    expect(parsed?.records[0].dayIndex).toBe(1);
  });

  it("表が無いページは記録なしで返す", () => {
    const parsed = parseQuestionPage(
      page("令和8年（第6回）田川市議会9月定例会一般質問一覧", "<p>準備中</p>"),
      PAGE_URL
    );
    expect(parsed?.records).toEqual([]);
    expect(parsed?.pdfUrl).toBeNull();
  });

  it("定例会のタイトルでないページは null", () => {
    expect(parseQuestionPage(page("議会インターネット中継", ""), PAGE_URL)).toBeNull();
  });
});

describe("parseQuestioner", () => {
  it("会派が複数行に折り返されていても読み取る", () => {
    expect(parseQuestioner("香月　隆一\n（社民党市議会\n議員団）")).toEqual({
      name: "香月 隆一",
      familyName: "香月",
      faction: "社民党市議会議員団",
    });
  });

  it("会派が無ければ null", () => {
    expect(parseQuestioner("柿田　孝子").faction).toBeNull();
  });

  it("会派だけのセルは氏名が空になる", () => {
    expect(parseQuestioner("（公明党）")).toEqual({
      name: "",
      familyName: "",
      faction: "公明党",
    });
  });
});

describe("parseQuestionItems", () => {
  it("番号で始まらない行は前の項目に連結し、英数字を半角にする", () => {
    expect(
      parseQuestionItems("１　市内ＪＲ駅におけるＩＣカード\n改札機の導入について\n２　ＤＸについて")
    ).toEqual(["市内JR駅におけるICカード改札機の導入について", "DXについて"]);
  });

  it("番号だけの行の次の行を本文として扱う", () => {
    expect(parseQuestionItems("1\n手話言語条例の制定について")).toEqual([
      "手話言語条例の制定について",
    ]);
  });

  it("数字で始まる折り返し行は新しい項目にしない", () => {
    expect(parseQuestionItems("１　市制施行\n80周年について")).toEqual([
      "市制施行80周年について",
    ]);
  });
});

describe("mergeQuestionPages", () => {
  it("本体と延期分を順番で並べ、PDFは本体のものを使う", () => {
    const main = parseQuestionPage(
      page(
        "令和2年（第1回）田川市議会3月定例会一般質問一覧",
        `<p>1日目：2月27日（木曜日）10時から</p><table><tr><td>1</td><td>髙瀬　冨士夫</td><td>1　Aについて</td></tr></table><a href="/x.pdf">PDF</a>`
      ),
      PAGE_URL
    );
    const deferred = parseQuestionPage(
      page(
        "令和2年（第1回）田川市議会3月定例会一般質問一覧 （延期分）",
        `<p>3月9日（月曜日）<br>10時～</p><table><tr><td>5</td><td>佐藤　俊一</td><td>1　Bについて</td></tr></table>`
      ),
      PAGE_URL
    );
    if (!main || !deferred) throw new Error("parse failed");
    const merged = mergeQuestionPages([deferred, main]);
    expect(merged.session.key).toBe("r2-1-teirei");
    expect(merged.pdfUrl).toBe("https://www.joho.tagawa.fukuoka.jp/x.pdf");
    expect(merged.records.map((r) => [r.order, r.memberName, r.pdfUrl])).toEqual([
      [1, "髙瀬 冨士夫", "https://www.joho.tagawa.fukuoka.jp/x.pdf"],
      [5, "佐藤 俊一", "https://www.joho.tagawa.fukuoka.jp/x.pdf"],
    ]);
  });

  it("本体と延期分の両方に載っている順番は、実際の日付を持つ延期分を優先する", () => {
    const main = parseQuestionPage(
      page(
        "令和2年（第1回）田川市議会3月定例会一般質問一覧",
        `<p>1日目：2月27日（木曜日）10時から</p><table><tr><td>5</td><td>佐藤　俊一</td><td>1　Bについて</td></tr></table>`
      ),
      PAGE_URL
    );
    const deferred = parseQuestionPage(
      page(
        "令和2年（第1回）田川市議会3月定例会一般質問一覧 （延期分）",
        `<p>3月9日（月曜日）<br>10時～</p><table><tr><td>5</td><td>佐藤　俊一</td><td>1　Bについて</td></tr></table>`
      ),
      PAGE_URL
    );
    if (!main || !deferred) throw new Error("parse failed");
    const merged = mergeQuestionPages([main, deferred]);
    expect(merged.records).toHaveLength(1);
    expect(merged.records[0].questionDate).toBe("2020-03-09");
  });

  it("統合するページが無ければエラーにする", () => {
    expect(() => mergeQuestionPages([])).toThrow();
  });
});
