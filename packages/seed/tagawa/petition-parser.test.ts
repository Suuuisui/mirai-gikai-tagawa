import { describe, expect, it } from "vitest";
import {
  classifyPetitionStatus,
  normalizeCommittees,
  parsePetitionPage,
  parsePetitionResult,
  sortPetitions,
} from "./petition-parser";

const PAGE_URL = "https://www.joho.tagawa.fukuoka.jp/kiji0038564/index.html";

function page(seiganRows: string, chinjoRows: string): string {
  return `<html><head><title>審査状況と審査結果（令和5年5月～） / 福岡県田川市</title></head><body>
何をお探しですか？
<table><tr><th>◆請願<br>番号</th><th>件　　　名</th><th>紹介議員</th><th>上程</th><th>付託<br>委員会</th><th>審査状況<br>結果【措置】</th></tr>${seiganRows}</table>
<table><tr><th>番号</th><th>件　　　　　名</th><th>上程</th><th>付託<br>委員会</th><th>審査状況<br>結果【措置】</th></tr>${chinjoRows}</table>
このページに関する お問い合わせ</body></html>`;
}

describe("parsePetitionPage", () => {
  it("請願の表から紹介議員・上程日・付託先・結果を読み取る", () => {
    const html = page(
      `<tr><td>２</td><td>田川市地区公民館建設補助金の見直しに関する請願<br><a href="/kiji0038564/a.pdf">請願文（第２号）（PDF：100.8キロバイト）</a></td><td>　(代表者)<br>柿田孝子<br>　梶原みつ子</td><td>令和7年<br>12月1日</td><td>総務文教</td><td>令和8年3月4日<br>採択<br>【執行部送付】</td></tr>`,
      ""
    );
    const [record] = parsePetitionPage(html, PAGE_URL);
    expect(record).toEqual({
      id: "seigan-kiji0038564-2",
      kind: "seigan",
      number: 2,
      title: "田川市地区公民館建設補助金の見直しに関する請願",
      documentUrl: "https://www.joho.tagawa.fukuoka.jp/kiji0038564/a.pdf",
      introducers: [
        { name: "柿田 孝子", familyName: "柿田" },
        { name: "梶原 みつ子", familyName: "梶原" },
      ],
      submittedDate: "2025-12-01",
      committees: ["総務文教委員会"],
      decidedDate: "2026-03-04",
      status: "adopted",
      result: "採択",
      measure: "執行部送付",
      sourceUrl: PAGE_URL,
      sourceTitle: "審査状況と審査結果（令和5年5月～）",
    });
  });

  it("陳情の表は紹介議員なしで読み取り、審査中は pending になる", () => {
    const html = page(
      "",
      `<tr><td>３</td><td>災害時ペット避難所の整備及び支援に関する陳情<br><a href="/kiji0038564/c.pdf">陳情文（第３号）（PDF：106.8キロバイト）</a></td><td>令和8年<br>9月7日</td><td>総務文教</td><td></td></tr>`
    );
    const [record] = parsePetitionPage(html, PAGE_URL);
    expect(record.kind).toBe("chinjo");
    expect(record.introducers).toEqual([]);
    expect(record.submittedDate).toBe("2026-09-07");
    expect(record.status).toBe("pending");
    expect(record.decidedDate).toBeNull();
    expect(record.result).toBeNull();
  });

  it("空欄の行（「-」だけの行）や見出し行は読み飛ばす", () => {
    const html = page(`<tr><td>-</td><td></td><td></td></tr>`, "");
    expect(parsePetitionPage(html, PAGE_URL)).toEqual([]);
  });

  it("H27.9.4 形式の古いページも同じ形で読み取る", () => {
    const html = page(
      `<tr><td>1</td><td>芳ヶ谷川の水質改善を求める請願</td><td>植木康太 </td><td>H27.9.4</td><td>厚　生</td><td>H27.12.18<br>採　択<br>【執行部送付】</td></tr>`,
      ""
    );
    const [record] = parsePetitionPage(html, PAGE_URL);
    expect(record.introducers).toEqual([{ name: "植木 康太", familyName: "植木" }]);
    expect(record.submittedDate).toBe("2015-09-04");
    expect(record.committees).toEqual(["厚生委員会"]);
    expect(record.decidedDate).toBe("2015-12-18");
    expect(record.result).toBe("採択");
  });
});

describe("parsePetitionResult", () => {
  it("項目ごとに結果が分かれる場合は項目つきでまとめ、partial にする", () => {
    const info = parsePetitionResult(
      "令和7年12月1日\n１ 不採択\n２ 採 択\n【執行部送付】"
    );
    expect(info).toEqual({
      status: "partial",
      result: "項目1: 不採択、項目2: 採択",
      measure: "執行部送付",
      decidedDate: "2025-12-01",
    });
  });

  it("項目ごとに審査日が違う場合は最後の日を審査日にする", () => {
    const info = parsePetitionResult(
      "(1)H24.9.4\n採択※意見\n【執行部送付】\n(2)H24.12.3\n不採択"
    );
    expect(info.decidedDate).toBe("2012-12-03");
    expect(info.result).toBe("項目1: 採択（意見付き）、項目2: 不採択");
    expect(info.status).toBe("partial");
  });

  it("措置だけが書かれていれば採択後の措置なので採択として扱う", () => {
    expect(parsePetitionResult("【執行部送付】")).toEqual({
      status: "adopted",
      result: null,
      measure: "執行部送付",
      decidedDate: null,
    });
  });

  it("1行に並んだ項目ごとの結果も分けて読み取る", () => {
    const info = parsePetitionResult("H28.2.22（1）採択（2）不採択【執行部送付】");
    expect(info.result).toBe("項目1: 採択、項目2: 不採択");
    expect(info.status).toBe("partial");
  });

  it("取り下げは採択の記載があっても優先する", () => {
    expect(parsePetitionResult("採択\n取り下げ").status).toBe("withdrawn");
  });

  it("取り下げ・継続審査・審議未了を分類する", () => {
    expect(parsePetitionResult("令和5年12月1日\n取り下げ").status).toBe("withdrawn");
    expect(parsePetitionResult("令和8年9月7日\n継続審査").status).toBe("continued");
    expect(parsePetitionResult("審議未了").status).toBe("expired");
    expect(parsePetitionResult("審査未了")).toEqual({
      status: "expired",
      result: "審査未了",
      measure: null,
      decidedDate: null,
    });
  });
});

describe("classifyPetitionStatus", () => {
  it("採択と不採択が混ざれば partial、どちらも無ければ pending", () => {
    expect(classifyPetitionStatus(["採択", "不採択"])).toBe("partial");
    expect(classifyPetitionStatus(["不採択"])).toBe("rejected");
    expect(classifyPetitionStatus(["採択（意見付き）"])).toBe("adopted");
    expect(classifyPetitionStatus([])).toBe("pending");
  });
});

describe("normalizeCommittees", () => {
  it("略称を正式名にし、字間の空白と改行分割を吸収する", () => {
    expect(normalizeCommittees("厚　生")).toEqual(["厚生委員会"]);
    expect(normalizeCommittees("世界記憶\n遺産事業\n推進特別")).toEqual([
      "世界記憶遺産事業推進特別委員会",
    ]);
  });

  it("項目ごとに付託先が分かれる場合は注記を除いて両方返す", () => {
    expect(normalizeCommittees("陳情項目(1)\n厚生\n陳情項目(2)\n総務文教")).toEqual([
      "厚生委員会",
      "総務文教委員会",
    ]);
  });
});

describe("sortPetitions", () => {
  it("上程日の新しい順、同日なら請願→陳情の順に並べる", () => {
    const base = parsePetitionPage(
      page(
        `<tr><td>1</td><td>A</td><td>柿田孝子</td><td>令和8年9月7日</td><td>総務文教</td><td></td></tr>`,
        `<tr><td>1</td><td>B</td><td>令和8年9月7日</td><td>総務文教</td><td></td></tr><tr><td>2</td><td>C</td><td>令和8年10月1日</td><td>総務文教</td><td></td></tr>`
      ),
      PAGE_URL
    );
    expect(sortPetitions(base).map((r) => r.title)).toEqual(["C", "A", "B"]);
  });
});
