import type { OfficialMinutesRecord } from "@mirai-gikai/shared/council/types";
import { describe, expect, it } from "vitest";
import {
  buildTreeRequestBody,
  bytesToLatin1,
  decideYearReplacement,
  diffMinutesRecords,
  encodeYearLabelToSjisBytes,
  FIRST_MINUTES_YEAR,
  jstYear,
  latin1ToBytes,
  mergeMinutesRecords,
  minutesYearLabels,
  normalizeSessionName,
  parseDayLabel,
  parseMinutesDays,
  parseSessionDepths,
  parseSiteCode,
  parseStoredMinutesIndex,
  percentEncodeBytes,
  resolveTargetYears,
  stripHtmlComments,
  toMinutesRecords,
} from "./minutes-index-parser";

/** Shift_JIS のバイト列（16進）を、応答を latin1 で読んだときの文字列にする */
function latin1Of(hex: string): string {
  return String.fromCharCode(
    ...hex.split(" ").map((byte) => Number.parseInt(byte, 16))
  );
}

/** latin1 の値（Shift_JIS のバイト列そのもの）を、読める文字列に戻す */
function decodeSjisLatin1(value: string): string {
  return new TextDecoder("shift_jis").decode(Buffer.from(value, "latin1"));
}

/** 実際の応答にある Shift_JIS のバイト列（「令和 8年」「令和 8年 第4回定例会 」など） */
const R8_YEAR = latin1Of("97 df 98 61 20 38 94 4e");
const R7_YEAR = latin1Of("97 df 98 61 20 37 94 4e");
const R8_SESSION_1 = latin1Of(
  "97 df 98 61 20 38 94 4e 20 91 e6 31 89 f1 97 d5 8e 9e 89 ef 20"
); // 令和 8年 第1回臨時会
const R8_SESSION_2 = latin1Of(
  "97 df 98 61 20 38 94 4e 20 91 e6 32 89 f1 92 e8 97 e1 89 ef 20"
); // 令和 8年 第2回定例会
const R8_SESSION_4 = latin1Of(
  "97 df 98 61 20 38 94 4e 20 91 e6 34 89 f1 92 e8 97 e1 89 ef 20"
); // 令和 8年 第4回定例会
const R8_SESSION_9_OLD = latin1Of(
  "97 df 98 61 20 38 94 4e 20 91 e6 39 89 f1 92 e8 97 e1 89 ef 20"
); // 令和 8年 第9回定例会（コメントの中にだけ出てくる想定）
const R7_SESSION_1 = latin1Of(
  "97 df 98 61 20 37 94 4e 20 91 e6 31 89 f1 92 e8 97 e1 89 ef 20"
); // 令和 7年 第1回定例会
const H9_YEAR = latin1Of("95 bd 90 ac 20 39 94 4e");
const H19_SESSION_1 = latin1Of(
  "95 bd 90 ac 31 39 94 4e 20 91 e6 31 89 f1 92 e8 97 e1 89 ef 20"
); // 平成19年 第1回定例会

/** 年のラベルを送ったときに返る応答HTML（実物の形。タブは生のリンクとコメントの両方にある） */
const YEAR_PAGE = `<TABLE bgcolor="white" border="0" cellpadding="0" cellspacing="0" WIDTH="150"><!-- 4+ --><TR><TD><A HREF="javascript:document.viewtree.submit()"onClick="document.viewtree.treedepth.value='${R8_YEAR}'"><IMG SRC="/tagawa/image/tab-R08.gif" BORDER="0" ALT="x"></A></TD></TR>
<TR><TD><A HREF="javascript:document.viewtree.submit()"onClick="document.viewtree.treedepth.value='${R7_YEAR}'"><IMG SRC="/tagawa/image/tab-R07-1.gif" BORDER="0" ALT="x"></A></TD></TR>
</TABLE><!-- 4- -->
<!--------------------------------------------------------------------------->
<!--
１．tabを単年度表示する場合
<TR><TD><A HREF="javascript:document.viewtree.submit()"onClick="document.viewtree.treedepth.value='${R8_YEAR}'"><IMG SRC="/tagawa/image/tab-R08.gif" BORDER="0" ALT="x"></A></TD></TR>
<A HREF="javascript:document.viewtree.submit()" onClick="document.viewtree.treedepth.value='${R8_SESSION_9_OLD}'">x</A><BR>
-->
<A HREF="javascript:document.viewtree.submit()" onClick="document.viewtree.treedepth.value='${R8_SESSION_1}'"><IMG SRC="/tagawa/image/r.gif" WIDTH="12" HEIGHT="12" BORDER="0">x</A><BR>
<A HREF="javascript:document.viewtree.submit()" onClick="document.viewtree.treedepth.value='${R8_SESSION_2}'"><IMG SRC="/tagawa/image/r.gif" WIDTH="12" HEIGHT="12" BORDER="0">x</A><BR>
<A HREF="javascript:document.viewtree.submit()" onClick="document.viewtree.treedepth.value='${R8_SESSION_4}'"><IMG SRC="/tagawa/image/r.gif" WIDTH="12" HEIGHT="12" BORDER="0">x</A><BR>
<BR>`;

/** 会議を開いたときに返る日ごとのリンク（実物の形。リンクの中に画像タグがある） */
const DAY_LIST = `<OL>
<A href="ResultFrame.exe?Code=pn3o7ap8t0jl59z6k3&fileName=R080612A&startPos=0">
<IMG SRC="/tagawa/image/r2.gif" WIDTH="12" HEIGHT="12" BORDER="0">（第1日 6月12日）</A><BR>
<A href="ResultFrame.exe?Code=pn3o7ap8t0jl59z6k3&fileName=R080617A&startPos=0">
<IMG SRC="/tagawa/image/r2.gif" WIDTH="12" HEIGHT="12" BORDER="0">（第2日 6月17日）</A><BR>
<A href="ResultFrame.exe?Code=pn3o7ap8t0jl59z6k3&fileName=R080618A&startPos=0">
<IMG SRC="/tagawa/image/r2.gif" WIDTH="12" HEIGHT="12" BORDER="0">（第3日 6月18日）</A><BR>
<A href="ResultFrame.exe?Code=pn3o7ap8t0jl59z6k3&fileName=R080701A&startPos=0">
<IMG SRC="/tagawa/image/r2.gif" WIDTH="12" HEIGHT="12" BORDER="0">（第4日 7月 1日）</A><BR>
</OL>`;

function record(
  date: string,
  fileName: string,
  sessionName = "令和8年 第4回定例会",
  dayLabel = "第1日"
): OfficialMinutesRecord {
  return { date, fileName, sessionName, dayLabel };
}

describe("stripHtmlComments", () => {
  it("HTMLコメントを取り除く", () => {
    expect(stripHtmlComments("a<!-- b -->c")).toBe("ac");
  });

  it("複数行にわたるコメントや、ハイフンだけが並ぶ区切りコメントも取り除く", () => {
    const html = "a<!--\n１．tab\n<A href=x>y</A>\n-->b<!------------------>c";
    expect(stripHtmlComments(html)).toBe("abc");
  });

  it("コメントが無ければそのまま返す", () => {
    expect(stripHtmlComments("<p>本文</p>")).toBe("<p>本文</p>");
    expect(stripHtmlComments("")).toBe("");
  });
});

describe("minutesYearLabels", () => {
  it("令和2年以降は元号の数字を2桁にそろえる（1桁は半角スペース埋め）", () => {
    expect(minutesYearLabels(2020)).toEqual(["令和 2年"]);
    expect(minutesYearLabels(2026)).toEqual(["令和 8年"]);
    expect(minutesYearLabels(2027)).toEqual(["令和 9年"]);
    expect(minutesYearLabels(2028)).toEqual(["令和10年"]);
  });

  it("2019年は令和元年と平成31年の両方を返す", () => {
    expect(minutesYearLabels(2019)).toEqual(["令和元年", "平成31年"]);
  });

  it("平成の年は平成NN年にする（1桁は半角スペース埋め）", () => {
    expect(minutesYearLabels(2018)).toEqual(["平成30年"]);
    expect(minutesYearLabels(2000)).toEqual(["平成12年"]);
    expect(minutesYearLabels(1998)).toEqual(["平成10年"]);
    expect(minutesYearLabels(1997)).toEqual(["平成 9年"]);
    expect(minutesYearLabels(1990)).toEqual(["平成 2年"]);
  });

  it("1989年は平成元年にする", () => {
    expect(minutesYearLabels(1989)).toEqual(["平成元年"]);
  });

  it("対象外の年や整数でない値は空配列にする", () => {
    expect(minutesYearLabels(1988)).toEqual([]);
    expect(minutesYearLabels(0)).toEqual([]);
    expect(minutesYearLabels(2026.5)).toEqual([]);
    expect(minutesYearLabels(Number.NaN)).toEqual([]);
  });
});

describe("encodeYearLabelToSjisBytes", () => {
  it("令和 8年 を Shift_JIS のバイト列にする（数字と半角スペースは ASCII）", () => {
    expect(encodeYearLabelToSjisBytes("令和 8年")).toEqual([
      0x97, 0xdf, 0x98, 0x61, 0x20, 0x38, 0x94, 0x4e,
    ]);
  });

  it("元年と平成も変換する", () => {
    expect(encodeYearLabelToSjisBytes("令和元年")).toEqual([
      0x97, 0xdf, 0x98, 0x61, 0x8c, 0xb3, 0x94, 0x4e,
    ]);
    expect(encodeYearLabelToSjisBytes("平成31年")).toEqual([
      0x95, 0xbd, 0x90, 0xac, 0x33, 0x31, 0x94, 0x4e,
    ]);
  });

  it("組み立てたバイト列を Shift_JIS として読むと、すべての年のラベルに戻る", () => {
    const decoder = new TextDecoder("shift_jis");
    for (let year = 1989; year <= 2040; year += 1) {
      for (const label of minutesYearLabels(year)) {
        const bytes = encodeYearLabelToSjisBytes(label);
        expect(decoder.decode(Uint8Array.from(bytes))).toBe(label);
      }
    }
  });

  it("知らない文字があれば例外を投げる", () => {
    expect(() => encodeYearLabelToSjisBytes("西暦2026年")).toThrow(
      "Shift_JIS に変換できない文字"
    );
    expect(() => encodeYearLabelToSjisBytes("令和8年'")).toThrow();
    expect(() => encodeYearLabelToSjisBytes("令和８年")).toThrow();
  });

  it("空文字は空のバイト列にする", () => {
    expect(encodeYearLabelToSjisBytes("")).toEqual([]);
  });
});

describe("percentEncodeBytes", () => {
  it("すべてのバイトを大文字16進の %XX にする（ASCII も含めて）", () => {
    expect(percentEncodeBytes([0x97, 0xdf, 0x20, 0x38, 0x0a])).toBe(
      "%97%DF%20%38%0A"
    );
  });

  it("空のバイト列は空文字にする", () => {
    expect(percentEncodeBytes([])).toBe("");
  });

  it("バイトの範囲外の値は例外を投げる", () => {
    expect(() => percentEncodeBytes([256])).toThrow(RangeError);
    expect(() => percentEncodeBytes([-1])).toThrow(RangeError);
    expect(() => percentEncodeBytes([1.5])).toThrow(RangeError);
  });
});

describe("bytesToLatin1 / latin1ToBytes", () => {
  it("バイト列と1バイト＝1文字の文字列を行き来しても元に戻る", () => {
    const bytes = [0x97, 0xdf, 0x98, 0x61, 0x20, 0x38, 0x94, 0x4e, 0xff, 0x00];
    expect(latin1ToBytes(bytesToLatin1(bytes))).toEqual(bytes);
    expect(bytesToLatin1(bytes)).toHaveLength(bytes.length);
  });

  it("応答を latin1 で読んだ値は、Shift_JIS として読み直すと会議名に戻る", () => {
    expect(decodeSjisLatin1(R8_SESSION_4)).toBe("令和 8年 第4回定例会 ");
    expect(decodeSjisLatin1(R8_YEAR)).toBe("令和 8年");
  });

  it("バイトの範囲を超える値や latin1 の範囲外の文字は例外を投げる", () => {
    expect(() => bytesToLatin1([256])).toThrow(RangeError);
    expect(() => latin1ToBytes("令")).toThrow(RangeError);
  });
});

describe("buildTreeRequestBody", () => {
  it("コード・パーセントエンコードした treedepth・空の page と fileName を並べる", () => {
    expect(
      buildTreeRequestBody(
        "pn3o7ap8t0jl59z6k3",
        encodeYearLabelToSjisBytes("令和 8年")
      )
    ).toBe(
      "Code=pn3o7ap8t0jl59z6k3&treedepth=%97%DF%98%61%20%38%94%4E&page=&fileName="
    );
  });

  it("会議の値（末尾の半角スペースを含む）も、そのままのバイト列で送る", () => {
    const body = buildTreeRequestBody("abc", latin1ToBytes(R8_SESSION_4));
    expect(body).toBe(
      "Code=abc&treedepth=%97%DF%98%61%20%38%94%4E%20%91%E6%34%89%F1%92%E8%97%E1%89%EF%20&page=&fileName="
    );
    expect(body.endsWith("%20&page=&fileName=")).toBe(true);
  });
});

describe("parseSiteCode", () => {
  it("トップページのリンクから Code= の値を取り出す", () => {
    const html = `<a href="cgi-bin3/See.exe?Code=pn3o7ap8t0jl59z6k3"><img src="image/menu02.gif" alt="会議録の閲覧"></a>`;
    expect(parseSiteCode(html)).toBe("pn3o7ap8t0jl59z6k3");
  });

  it("&amp; 区切りのリンクからも取り出す", () => {
    const html = `<a href="cgi-bin3/Search2.exe?Code=abc123&amp;sTarget=2">検索</a>`;
    expect(parseSiteCode(html)).toBe("abc123");
  });

  it("コメントの中の Code= は拾わない", () => {
    const html = `<!-- <a href="See.exe?Code=old999">旧</a> --><a href="See.exe?Code=new111">新</a>`;
    expect(parseSiteCode(html)).toBe("new111");
  });

  it("ErrorCode= のような別の名前は拾わない", () => {
    expect(parseSiteCode(`<a href="x.exe?ErrorCode=zzz">x</a>`)).toBeNull();
  });

  it("Code= が無い・空入力なら null を返す", () => {
    expect(parseSiteCode("<html></html>")).toBeNull();
    expect(parseSiteCode("")).toBeNull();
  });
});

describe("parseSessionDepths", () => {
  it("年のタブとコメントの中の値を除き、その年の会議の値だけを出現順に返す", () => {
    expect(parseSessionDepths(YEAR_PAGE, R8_YEAR)).toEqual([
      R8_SESSION_1,
      R8_SESSION_2,
      R8_SESSION_4,
    ]);
  });

  it("返す値は Shift_JIS のバイト列のままで、読み直すと会議名に戻る", () => {
    const names = parseSessionDepths(YEAR_PAGE, R8_YEAR).map(decodeSjisLatin1);
    expect(names).toEqual([
      "令和 8年 第1回臨時会 ",
      "令和 8年 第2回定例会 ",
      "令和 8年 第4回定例会 ",
    ]);
  });

  it("別の年の会議は拾わない", () => {
    const html = `<A onClick="document.viewtree.treedepth.value='${R7_SESSION_1}'">x</A><A onClick="document.viewtree.treedepth.value='${R8_SESSION_1}'">x</A>`;
    expect(parseSessionDepths(html, R8_YEAR)).toEqual([R8_SESSION_1]);
    expect(parseSessionDepths(html, R7_YEAR)).toEqual([R7_SESSION_1]);
  });

  it("年ラベルは桁そろえの空白まで含めて照合する（平成 9年 と平成19年 を取り違えない）", () => {
    const html = `<A onClick="document.viewtree.treedepth.value='${H19_SESSION_1}'">x</A>`;
    expect(parseSessionDepths(html, H9_YEAR)).toEqual([]);
  });

  it("同じ値が複数回出てきても1つにまとめる", () => {
    const html = `<A onClick="document.viewtree.treedepth.value='${R8_SESSION_1}'">x</A><A onClick="document.viewtree.treedepth.value='${R8_SESSION_1}'">x</A>`;
    expect(parseSessionDepths(html, R8_YEAR)).toEqual([R8_SESSION_1]);
  });

  it("会議が1つも無い応答・空入力は空配列にする", () => {
    const tabsOnly = `<A onClick="document.viewtree.treedepth.value='${R8_YEAR}'">x</A>`;
    expect(parseSessionDepths(tabsOnly, R8_YEAR)).toEqual([]);
    expect(parseSessionDepths("", R8_YEAR)).toEqual([]);
  });
});

describe("parseMinutesDays", () => {
  it("実物の形（リンクの中に画像タグ）から、ファイル名とリンクの文字を取り出す", () => {
    expect(parseMinutesDays(DAY_LIST)).toEqual([
      { fileName: "R080612A", label: "（第1日 6月12日）" },
      { fileName: "R080617A", label: "（第2日 6月17日）" },
      { fileName: "R080618A", label: "（第3日 6月18日）" },
      { fileName: "R080701A", label: "（第4日 7月 1日）" },
    ]);
  });

  it("画像タグが無く、リンクの文字が次の行にある形も読み取る", () => {
    const html = `<OL>
<A href="ResultFrame.exe?Code=pn3o7ap8t0jl59z6k3&fileName=R080612A&startPos=0">
（第1日 6月12日）</A><BR>
</OL>`;
    expect(parseMinutesDays(html)).toEqual([
      { fileName: "R080612A", label: "（第1日 6月12日）" },
    ]);
  });

  it("大文字小文字・引用符・&amp;・改行の違いに耐える", () => {
    const html = `<a HREF='ResultFrame.exe?Code=c1&amp;fileName=H100305A&amp;startPos=0'>
  （第1日
  3月 5日）
</a><A
  href=ResultFrame.exe?Code=c1&fileName=H100306A&startPos=0>（第2日 3月 6日）</A>`;
    expect(parseMinutesDays(html)).toEqual([
      { fileName: "H100305A", label: "（第1日 3月 5日）" },
      { fileName: "H100306A", label: "（第2日 3月 6日）" },
    ]);
  });

  it("コメントの中のリンクは拾わない", () => {
    const html = `<!-- <A href="ResultFrame.exe?Code=c&fileName=R010101A&startPos=0">（第1日 1月 1日）</A> -->
<A href="ResultFrame.exe?Code=c&fileName=R080612A&startPos=0">（第1日 6月12日）</A>`;
    expect(parseMinutesDays(html).map((day) => day.fileName)).toEqual([
      "R080612A",
    ]);
  });

  it("会議の切り替えのリンクなど、会議録のリンクではない <a> は拾わない", () => {
    const html = `<A HREF="javascript:document.viewtree.submit()" onClick="document.viewtree.treedepth.value='x'">令和 8年 第4回定例会</A><BR>
<A href="Search2.exe?Code=c&sTarget=2">会議録の検索</A>
<A href="ResultFrame.exe?Code=c&startPos=0">fileName の無いリンク</A>`;
    expect(parseMinutesDays(html)).toEqual([]);
  });

  it("閉じられていない <a> に引きずられず、会議録のリンクを正しく読む", () => {
    const html = `<a href="x">閉じ忘れ <A href="ResultFrame.exe?Code=c&fileName=R080612A&startPos=0">（第1日 6月12日）</A>`;
    expect(parseMinutesDays(html)).toEqual([
      { fileName: "R080612A", label: "（第1日 6月12日）" },
    ]);
  });

  it("リンクが無い・空入力なら空配列にする", () => {
    expect(parseMinutesDays("<OL></OL>")).toEqual([]);
    expect(parseMinutesDays("")).toEqual([]);
  });
});

describe("normalizeSessionName", () => {
  it("元号と数字の間の桁そろえの空白を詰め、前後の空白を除く", () => {
    expect(normalizeSessionName("令和 8年 第4回定例会 ")).toBe(
      "令和8年 第4回定例会"
    );
    expect(normalizeSessionName("平成 9年 第1回臨時会 ")).toBe(
      "平成9年 第1回臨時会"
    );
  });

  it("2桁の年や元年はそのまま、前後の空白だけ除く", () => {
    expect(normalizeSessionName("令和10年 第1回定例会 ")).toBe(
      "令和10年 第1回定例会"
    );
    expect(normalizeSessionName("令和元年 第1回臨時会 ")).toBe(
      "令和元年 第1回臨時会"
    );
    expect(normalizeSessionName("平成31年 第1回定例会 ")).toBe(
      "平成31年 第1回定例会"
    );
  });

  it("空白だけ・空文字は空文字にする", () => {
    expect(normalizeSessionName("  ")).toBe("");
    expect(normalizeSessionName("")).toBe("");
  });
});

describe("parseDayLabel", () => {
  it("（第1日 6月12日）から 第1日 を取り出す", () => {
    expect(parseDayLabel("（第1日 6月12日）")).toBe("第1日");
    expect(parseDayLabel("（第4日 7月 1日）")).toBe("第4日");
  });

  it("日数が2桁でも、全角数字でも 第N日 にする", () => {
    expect(parseDayLabel("（第10日 12月 9日）")).toBe("第10日");
    expect(parseDayLabel("（第１日 ６月１２日）")).toBe("第1日");
  });

  it("第N日 が読めなければ、括弧と前後の空白を除いた文字にする", () => {
    expect(parseDayLabel("（目次）")).toBe("目次");
    expect(parseDayLabel(" (付録) ")).toBe("付録");
    expect(parseDayLabel("（６月１２日）")).toBe("６月１２日");
  });

  it("空文字は空文字にする", () => {
    expect(parseDayLabel("")).toBe("");
  });
});

describe("toMinutesRecords", () => {
  it("ファイル名から開催日を引き、会議名と何日目をつけて記録にする", () => {
    const { records, skippedFileNames } = toMinutesRecords(
      "令和8年 第4回定例会",
      parseMinutesDays(DAY_LIST)
    );
    expect(skippedFileNames).toEqual([]);
    expect(records).toEqual([
      record("2026-06-12", "R080612A", "令和8年 第4回定例会", "第1日"),
      record("2026-06-17", "R080617A", "令和8年 第4回定例会", "第2日"),
      record("2026-06-18", "R080618A", "令和8年 第4回定例会", "第3日"),
      record("2026-07-01", "R080701A", "令和8年 第4回定例会", "第4日"),
    ]);
  });

  it("平成のファイル名も開催日にする", () => {
    const { records } = toMinutesRecords("平成10年 第1回定例会", [
      { fileName: "H100305A", label: "（第1日 3月 5日）" },
    ]);
    expect(records).toEqual([
      record("1998-03-05", "H100305A", "平成10年 第1回定例会", "第1日"),
    ]);
  });

  it("開催日が読めないファイル名は記録に入れず、skippedFileNames に返す", () => {
    const { records, skippedFileNames } = toMinutesRecords(
      "令和8年 第4回定例会",
      [
        { fileName: "R080612A", label: "（第1日 6月12日）" },
        { fileName: "INDEX", label: "（目次）" },
      ]
    );
    expect(records.map((r) => r.fileName)).toEqual(["R080612A"]);
    expect(skippedFileNames).toEqual(["INDEX"]);
  });

  it("リンクが無ければ空にする", () => {
    expect(toMinutesRecords("令和8年 第4回定例会", [])).toEqual({
      records: [],
      skippedFileNames: [],
    });
  });
});

describe("実物の形の応答を順にたどる", () => {
  it("年の応答 → 会議の値の再送 → 日ごとの記録まで、令和8年の形でつながる", () => {
    const depths = parseSessionDepths(YEAR_PAGE, R8_YEAR);
    // 会議の値は、サイトが書いてきたバイト列のまま送り返す
    const body = buildTreeRequestBody(
      "pn3o7ap8t0jl59z6k3",
      latin1ToBytes(depths[2])
    );
    expect(body).toContain("treedepth=%97%DF%98%61%20%38%94%4E%20%91%E6%34");
    const sessionName = normalizeSessionName(decodeSjisLatin1(depths[2]));
    expect(sessionName).toBe("令和8年 第4回定例会");
    const { records } = toMinutesRecords(
      sessionName,
      parseMinutesDays(DAY_LIST)
    );
    expect(records.map((r) => `${r.date} ${r.dayLabel}`)).toEqual([
      "2026-06-12 第1日",
      "2026-06-17 第2日",
      "2026-06-18 第3日",
      "2026-07-01 第4日",
    ]);
  });
});

describe("mergeMinutesRecords", () => {
  it("取り直した年の分は今回の結果で置き換える（今回無くなったものは消える）", () => {
    const previous = [
      record("2026-06-12", "R080612A"),
      record("2026-06-17", "R080617A"),
    ];
    const crawled = [
      record("2026-06-12", "R080612A", "令和8年 第4回定例会", "第1日（更新）"),
    ];
    expect(mergeMinutesRecords(previous, crawled, [2026])).toEqual(crawled);
  });

  it("取り直していない年は前回のまま残す", () => {
    const old = record("2025-12-03", "R071203A", "令和7年 第6回定例会");
    const merged = mergeMinutesRecords(
      [old, record("2026-06-12", "R080612A")],
      [record("2026-06-12", "R080612A"), record("2026-06-17", "R080617A")],
      [2026]
    );
    expect(merged.map((r) => r.fileName)).toEqual([
      "R071203A",
      "R080612A",
      "R080617A",
    ]);
    expect(merged[0]).toBe(old);
  });

  it("ファイル名の重複は今回の分を優先して1件にする", () => {
    const merged = mergeMinutesRecords(
      [record("2025-12-03", "R071203A", "前回の会議名")],
      [
        record("2025-12-03", "R071203A", "今回の会議名"),
        record("2025-12-03", "R071203A", "今回の会議名（重複）"),
      ],
      []
    );
    expect(merged).toEqual([
      record("2025-12-03", "R071203A", "今回の会議名（重複）"),
    ]);
  });

  it("開催日の昇順、同じ日はファイル名の昇順に並べる", () => {
    const merged = mergeMinutesRecords(
      [record("2026-06-12", "R080612B"), record("2019-03-08", "H310308A")],
      [record("2026-06-12", "R080612A"), record("2026-02-19", "R080219A")],
      [2026]
    );
    expect(merged.map((r) => r.fileName)).toEqual([
      "H310308A",
      "R080219A",
      "R080612A",
    ]);
  });

  it("2019年のように元号をまたぐ年も、西暦（date の先頭4桁）で判定する", () => {
    const merged = mergeMinutesRecords(
      [record("2019-03-08", "H310308A"), record("2019-06-13", "R010613A")],
      [record("2019-06-13", "R010613A"), record("2019-09-10", "R010910A")],
      [2019]
    );
    expect(merged.map((r) => r.fileName)).toEqual(["R010613A", "R010910A"]);
  });

  it("前回が空なら今回の分だけ、どちらも空なら空を返す", () => {
    const crawled = [record("2026-06-12", "R080612A")];
    expect(mergeMinutesRecords([], crawled, [2026])).toEqual(crawled);
    expect(mergeMinutesRecords([], [], [2026])).toEqual([]);
  });

  it("取り直した年に今回の記録が1件も無ければ、その年の前回の分は消える（安全弁は呼び出し側）", () => {
    expect(
      mergeMinutesRecords([record("2026-06-12", "R080612A")], [], [2026])
    ).toEqual([]);
  });

  it("入力の配列を書き換えない", () => {
    const previous = [
      record("2026-06-17", "R080617A"),
      record("2025-12-03", "R071203A"),
    ];
    const crawled = [record("2026-06-12", "R080612A")];
    mergeMinutesRecords(previous, crawled, [2026]);
    expect(previous.map((r) => r.fileName)).toEqual(["R080617A", "R071203A"]);
    expect(crawled).toHaveLength(1);
  });
});

describe("diffMinutesRecords", () => {
  it("next にあって previous に無いものを、開催日の昇順で返す", () => {
    const previous = [record("2026-06-12", "R080612A")];
    const next = [
      record("2026-07-01", "R080701A"),
      record("2026-06-12", "R080612A"),
      record("2026-06-17", "R080617A"),
    ];
    expect(diffMinutesRecords(previous, next).map((r) => r.fileName)).toEqual([
      "R080617A",
      "R080701A",
    ]);
  });

  it("ファイル名で判定する（会議名や何日目が変わっても増えたとは数えない）", () => {
    const previous = [record("2026-06-12", "R080612A", "旧", "第1日")];
    const next = [record("2026-06-12", "R080612A", "新", "第9日")];
    expect(diffMinutesRecords(previous, next)).toEqual([]);
  });

  it("previous が空なら next の全件、next が空なら空を返す", () => {
    const next = [
      record("2026-06-17", "R080617A"),
      record("2026-06-12", "R080612A"),
    ];
    expect(diffMinutesRecords([], next).map((r) => r.fileName)).toEqual([
      "R080612A",
      "R080617A",
    ]);
    expect(diffMinutesRecords(next, [])).toEqual([]);
  });

  it("next に同じファイル名が重複していても1件にする", () => {
    const next = [
      record("2026-06-12", "R080612A"),
      record("2026-06-12", "R080612A"),
    ];
    expect(diffMinutesRecords([], next)).toHaveLength(1);
  });
});

describe("jstYear", () => {
  it("UTC では年末でも、日本時間で元日になっていれば新年を返す", () => {
    expect(jstYear(new Date("2026-12-31T14:59:59Z"))).toBe(2026);
    expect(jstYear(new Date("2026-12-31T15:00:00Z"))).toBe(2027);
  });

  it("年の途中は UTC の年と同じ", () => {
    expect(jstYear(new Date("2026-10-11T03:00:00Z"))).toBe(2026);
  });
});

describe("resolveTargetYears", () => {
  const now = new Date("2026-10-11T03:00:00Z");

  it("引数なしは、日本時間の前年と今年を返す", () => {
    expect(resolveTargetYears([], now)).toEqual([2025, 2026]);
  });

  it("UTC では12月31日でも、日本時間で元日なら新年を今年として数える", () => {
    expect(resolveTargetYears([], new Date("2026-12-31T16:00:00Z"))).toEqual([
      2026, 2027,
    ]);
  });

  it("--all は平成10年（1998年）から今年までを返す", () => {
    const years = resolveTargetYears(["--all"], now);
    expect(years[0]).toBe(FIRST_MINUTES_YEAR);
    expect(FIRST_MINUTES_YEAR).toBe(1998);
    expect(years.at(-1)).toBe(2026);
    expect(years).toHaveLength(2026 - 1998 + 1);
  });

  it("--years は指定した年を、重複なしの昇順で返す", () => {
    expect(resolveTargetYears(["--years", "2026,2025,2026"], now)).toEqual([
      2025, 2026,
    ]);
    expect(resolveTargetYears(["--years", "2019"], now)).toEqual([2019]);
  });

  it("--years=2025,2026 の形も読む", () => {
    expect(resolveTargetYears(["--years=2025,2026"], now)).toEqual([
      2025, 2026,
    ]);
  });

  it("pnpm が渡す単独の -- は無視する", () => {
    expect(resolveTargetYears(["--", "--all"], now)).toHaveLength(29);
    expect(resolveTargetYears(["--", "--years", "2026"], now)).toEqual([2026]);
  });

  it("--all と --years を同時に指定すると例外を投げる", () => {
    expect(() => resolveTargetYears(["--all", "--years", "2026"], now)).toThrow(
      "同時に指定できません"
    );
  });

  it("年が西暦4桁でなければ例外を投げる", () => {
    expect(() => resolveTargetYears(["--years", "26"], now)).toThrow("西暦4桁");
    expect(() => resolveTargetYears(["--years", "令和8"], now)).toThrow();
    expect(() => resolveTargetYears(["--years", "2025,"], now)).toThrow();
    expect(() => resolveTargetYears(["--years="], now)).toThrow();
  });

  it("--years に値が無ければ例外を投げる", () => {
    expect(() => resolveTargetYears(["--years"], now)).toThrow("--years には");
    expect(() => resolveTargetYears(["--years", "--all"], now)).toThrow();
  });

  it("知らない引数は例外を投げる（綴り間違いで黙って既定の範囲を取り直さない）", () => {
    expect(() => resolveTargetYears(["--year", "2025"], now)).toThrow(
      "知らない引数"
    );
  });
});

describe("decideYearReplacement", () => {
  it("リクエストが失敗した年は、前回のまま残す", () => {
    expect(
      decideYearReplacement({
        failed: true,
        sessionCount: 3,
        recordCount: 10,
        previousRecordCount: 12,
      })
    ).toBe("keep-failed");
  });

  it("会議が1つも取れず、前回はその年の記録があった年は、前回のまま残す", () => {
    expect(
      decideYearReplacement({
        failed: false,
        sessionCount: 0,
        recordCount: 0,
        previousRecordCount: 12,
      })
    ).toBe("keep-empty");
  });

  it("会議は見えても会議録が1件も取れず、前回に記録がある年も、前回のまま残す", () => {
    expect(
      decideYearReplacement({
        failed: false,
        sessionCount: 4,
        recordCount: 0,
        previousRecordCount: 12,
      })
    ).toBe("keep-empty");
  });

  it("前回に記録が無い年は、何も取れなくても置き換える（結果は変わらない）", () => {
    expect(
      decideYearReplacement({
        failed: false,
        sessionCount: 0,
        recordCount: 0,
        previousRecordCount: 0,
      })
    ).toBe("replace");
  });

  it("取れた年は置き換える（前回より減っていても、サイトの今の状態を正とする）", () => {
    expect(
      decideYearReplacement({
        failed: false,
        sessionCount: 2,
        recordCount: 6,
        previousRecordCount: 12,
      })
    ).toBe("replace");
  });
});

describe("parseStoredMinutesIndex", () => {
  const valid = {
    code: "pn3o7ap8t0jl59z6k3",
    records: [record("2026-06-12", "R080612A")],
  };

  it("保存した JSON を読んで code と records を返す", () => {
    expect(parseStoredMinutesIndex(JSON.stringify(valid))).toEqual(valid);
  });

  it("records が空でも読める", () => {
    expect(parseStoredMinutesIndex('{"code":"abc","records":[]}')).toEqual({
      code: "abc",
      records: [],
    });
  });

  it("JSON として壊れていれば例外を投げる（空の一覧として扱わない）", () => {
    expect(() => parseStoredMinutesIndex("{")).toThrow("JSON として読めません");
    expect(() => parseStoredMinutesIndex("")).toThrow();
  });

  it.each([
    ["code が無い", { records: [] }],
    ["code が文字列でない", { code: 1, records: [] }],
    ["records が配列でない", { code: "abc", records: {} }],
    ["null", null],
    [
      "記録の項目が足りない",
      { code: "abc", records: [{ date: "2026-06-12" }] },
    ],
    [
      "日付の形が違う",
      { code: "abc", records: [record("2026/06/12", "R080612A")] },
    ],
    ["ファイル名が空", { code: "abc", records: [record("2026-06-12", "")] }],
  ])("形が違えば（%s）例外を投げる", (_label, value) => {
    expect(() => parseStoredMinutesIndex(JSON.stringify(value))).toThrow(
      "会議録の一覧は"
    );
  });
});
