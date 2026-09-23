import { type GlossaryEntry, glossaryWords } from "../data/glossary";

/** 本文中で印を付ける位置（テキストノード内の範囲と、対応することば） */
export interface GlossaryMark {
  start: number;
  end: number;
  entry: GlossaryEntry;
}

/** 漢字（々を含む） */
const KANJI = /[一-鿿㐀-䶿々]/;
/** カタカナ（長音符を含む） */
const KATAKANA = /[ァ-ヶー]/;

/**
 * ことばの後ろに付いても別の熟語にはならない字。
 * 「補正予算案」「当初予算額」「決算後」のように、ことば＋この字なら印を付けてよい
 */
const HARMLESS_SUFFIXES = new Set(["案", "額", "等", "分", "後", "前", "中"]);

function sameScript(a: string, b: string): boolean {
  return (
    (KANJI.test(a) && KANJI.test(b)) || (KATAKANA.test(a) && KATAKANA.test(b))
  );
}

/**
 * その位置のことばが、より長い熟語の一部ではないか。
 * 漢字のことばの直前・直後に漢字が続く（「財政調整基金」の中の「基金」、
 * 「一般会計補正予算」の中の「補正予算」）、カタカナのことばの前後にカタカナが
 * 続く場合は熟語の一部とみなす。かなで終わることば（「同意を求める」）の後ろに
 * 漢字が来るのは普通の文なので印を付ける
 */
function isStandalone(text: string, start: number, end: number): boolean {
  const before = start > 0 ? text[start - 1] : "";
  const after = end < text.length ? text[end] : "";
  if (before && sameScript(before, text[start])) return false;
  if (
    after &&
    sameScript(after, text[end - 1]) &&
    !HARMLESS_SUFFIXES.has(after)
  ) {
    return false;
  }
  return true;
}

/**
 * テキストの中で、まだ印を付けていないことばの最初の出現位置を探す。
 * 同じ位置に複数のことばが当たるときは長いものを優先する
 *
 * @param skip 既に印を付けたことば（見出し語）。2回目以降は付けない
 */
export function findGlossaryMark(
  text: string,
  entries: readonly GlossaryEntry[],
  skip: ReadonlySet<string>
): GlossaryMark | null {
  let best: GlossaryMark | null = null;
  for (const entry of entries) {
    if (skip.has(entry.term)) continue;
    for (const word of glossaryWords(entry)) {
      let from = 0;
      while (from <= text.length) {
        const start = text.indexOf(word, from);
        if (start === -1) break;
        const end = start + word.length;
        if (isStandalone(text, start, end)) {
          const better =
            best === null ||
            start < best.start ||
            (start === best.start && end > best.end);
          if (better) best = { start, end, entry };
          break;
        }
        from = start + 1;
      }
    }
  }
  return best;
}
