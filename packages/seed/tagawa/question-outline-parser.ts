/**
 * 一般質問の通告書PDF（pdftotext -layout の出力）から、議員ごとの
 * 質問事項と要旨（⑴⑵…、その下のア・イ…）を読み取る【田川市専用】
 *
 * PDFは「N．姓 名 議員（会派）【一問一答】」の見出しの下に、左列＝質問事項、
 * 右列＝要旨、右端＝備考の3列の表が並ぶ。-layout 出力では列の位置が
 * 文字数の間隔として残るので、行の先頭位置と大きな空白で左右を分ける。
 * 純粋関数のみ。テストは question-outline-parser.test.ts
 */

import type {
  QuestionFormat,
  QuestionOutlineItem,
} from "@mirai-gikai/shared/council/types";
import { normalizeSpaces, toHalfWidthAlnum } from "./council-html-utils";
import { normalizeDigits } from "./http-utils";

export interface QuestionOutline {
  /** 一般質問一覧ページの「順番」と同じ番号 */
  order: number;
  format: QuestionFormat | null;
  items: QuestionOutlineItem[];
}

/** 左列（質問事項）とみなす行頭の最大インデント */
const LEFT_COLUMN_MAX_INDENT = 11;
/** 左右の列を分ける空白の最小幅 */
const COLUMN_GAP = 3;
/** 右列がこれより左から始まることはない */
const RIGHT_COLUMN_MIN_START = 18;

const MEMBER_HEADER = /^\s{0,3}([0-9０-９]+)\s*[．.]\s*\S.*?議員/;
const COLUMN_HEADER = /質.*問.*事.*項.*要.*旨/;
const POINT_MARK = /^([⑴-⒇])\s*(.*)$/;
const SUB_POINT_MARK = /^[（(]?([ア-ン])[）)]?\s+(.*)$/;
const ITEM_NUMBER = /^([0-9０-９]+)\s+(.*)$/;

function isFurniture(trimmed: string): boolean {
  return (
    /^[0-9０-９]+$/.test(trimmed) ||
    /^(令和|平成)[0-9０-９元]+年[（(]第[0-9０-９]+回[）)].*一般質問$/.test(trimmed) ||
    /^(令和|平成)[0-9０-９元]+年\s*[0-9０-９]+月\s*[0-9０-９]+日([・、,][0-9０-９]+日)*$/.test(
      trimmed
    )
  );
}

/**
 * 折り返しの連結でできた日本語の文字間の空白（「市民プール で開催して いる」）を
 * 取り除き、英数字を半角にする。英数字どうしの間の空白は残す
 */
function cleanText(text: string): string {
  return toHalfWidthAlnum(normalizeSpaces(text)).replace(
    /(?<=[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff。、（）「」・]) +(?=[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff。、（）「」・])/g,
    ""
  );
}

function parseFormat(header: string): QuestionFormat | null {
  const m = header.match(/【([^】]+)】/);
  if (!m) return null;
  if (m[1].includes("一問一答")) return "一問一答";
  if (m[1].includes("一括") || m[1].includes("総括")) return "一括質問";
  return null;
}

/**
 * 行を左列（質問事項）と右列（要旨）に分ける。
 * 行頭が深ければ全体を右列、そうでなければ「3文字以上の空白の後に
 * 18桁目以降から文字が始まる」最初の位置で左右に分ける
 * （「１       ＲＳウイルス」のような番号と項目名の間の空白は分割点にしない）
 */
export function splitColumns(line: string): { left: string; right: string } {
  const indent = line.length - line.trimStart().length;
  if (indent > LEFT_COLUMN_MAX_INDENT) {
    return { left: "", right: line.trim() };
  }
  for (const gap of line.matchAll(/\s+(?=\S)/g)) {
    const rightStart = gap.index + gap[0].length;
    if (gap[0].length >= COLUMN_GAP && rightStart >= RIGHT_COLUMN_MIN_START) {
      return {
        left: line.slice(0, gap.index).trim(),
        right: line.slice(rightStart).trim(),
      };
    }
  }
  return { left: line.trim(), right: "" };
}

/**
 * pdftotext -layout の全文から議員ごとの要旨を読み取る。
 * 見出しの直後に列見出し（質問事項／要旨）が来る箇所だけを議員の区切りとみなし、
 * 表紙の質問者一覧を誤って拾わないようにする
 */
export function parseQuestionOutlines(layoutText: string): QuestionOutline[] {
  const lines = layoutText.split("\n");
  const outlines: QuestionOutline[] = [];
  let current: QuestionOutline | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\f/g, "");
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 見出し候補の直後に列見出しが来る場合だけ議員の区切りとみなす
    // （表紙の質問者一覧や「市会議員団」のような会派名に含まれる「議員」を除外する）
    const header = line.match(MEMBER_HEADER);
    if (header) {
      // 見出しの後ろ、列見出しまでの間に【一問一答】だけの行が挟まることがある
      const following = lines
        .slice(i + 1, i + 4)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const columnHeaderIndex = following.findIndex((l) => COLUMN_HEADER.test(l));
      if (columnHeaderIndex >= 0) {
        const headerText = [trimmed, ...following.slice(0, columnHeaderIndex)].join(" ");
        current = {
          order: Number(normalizeDigits(header[1])),
          format: parseFormat(headerText),
          items: [],
        };
        outlines.push(current);
        continue;
      }
    }
    if (!current) continue;
    if (COLUMN_HEADER.test(trimmed) || isFurniture(trimmed)) continue;

    const { left, right } = splitColumns(line);

    if (left) {
      const numbered = normalizeDigits(left).match(ITEM_NUMBER);
      if (numbered) {
        current.items.push({ title: cleanText(numbered[2]), points: [] });
      } else if (/^[0-9０-９]+$/.test(left)) {
        current.items.push({ title: "", points: [] });
      } else if (current.items.length > 0) {
        const item = current.items[current.items.length - 1];
        item.title = cleanText(item.title + left);
      }
    }

    if (right) {
      const item = current.items[current.items.length - 1];
      if (!item) continue;
      const point = right.match(POINT_MARK);
      const sub = right.match(SUB_POINT_MARK);
      if (point) {
        item.points.push({ text: cleanText(point[2]), subPoints: [] });
      } else if (sub && item.points.length > 0) {
        item.points[item.points.length - 1].subPoints.push(cleanText(sub[2]));
      } else if (item.points.length > 0) {
        // 折り返し行: ア・イ…が始まっていればその最後の項目に、無ければ⑴の本文に足す
        const last = item.points[item.points.length - 1];
        if (last.subPoints.length > 0) {
          last.subPoints[last.subPoints.length - 1] = cleanText(
            last.subPoints[last.subPoints.length - 1] + right
          );
        } else {
          last.text = cleanText(last.text + right);
        }
      }
    }
  }

  return outlines.map((outline) => ({
    ...outline,
    items: outline.items.filter((item) => item.title || item.points.length > 0),
  }));
}
