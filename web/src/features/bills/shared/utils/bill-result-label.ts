/**
 * 議決結果のバッジに出す語の決定【田川市専用】
 *
 * bills.status（enum）は「成立した（enacted）／成立しなかった（rejected）」の
 * 粗い区分しか持たない。議決の種類は案件ごとに違い（条例・予算は可決、決算は認定、
 * 人事は同意、専決処分の報告は承認、請願・陳情は採択）、市の議決結果ページの語は
 * bills.status_note に入っている（seed の buildStatusNote）。
 * status だけから「可決」「否決」と出すと、不認定の決算が「否決」、同意された人事が
 * 「可決」になるため、status_note の語を優先する。
 */

/** 議決済みの status。結果の語を決める対象はこの2つだけ */
export type DecidedBillStatus = "enacted" | "rejected";

/** status_note が空・想定外の語のときに出す語（従来の表示） */
const FALLBACK_RESULT_LABELS: Record<DecidedBillStatus, string> = {
  enacted: "可決",
  rejected: "否決",
};

/**
 * status ごとの「status_note の語 → バッジの語」。
 * status と食い違う語（enacted なのに「不認定」など）はここに無いので従来の表示に戻り、
 * バッジの色（status で決まる）と語が逆向きになることはない。
 * 「原案可決」は、修正なしで可決されたことを表す語なので「可決」と出す。
 * 「修正議決」「修正可決」は修正のうえ可決されたことが分かるよう、そのまま出す
 */
const RESULT_LABELS: Record<
  DecidedBillStatus,
  Readonly<Record<string, string>>
> = {
  enacted: {
    原案可決: "可決",
    可決: "可決",
    修正議決: "修正議決",
    修正可決: "修正可決",
    認定: "認定",
    同意: "同意",
    承認: "承認",
    採択: "採択",
    適任: "適任",
  },
  rejected: {
    否決: "否決",
    不認定: "不認定",
    不同意: "不同意",
    不承認: "不承認",
    不採択: "不採択",
  },
};

/**
 * status_note の末尾に付く注記。出典（「（本会議の中継映像より）」
 * 「（本会議会議録より自動抽出）」）や補足（「(戒告)」）で、全角・半角どちらの括弧もある
 */
const TRAILING_NOTE_PATTERN = /\s*[（(][^（）()]*[）)]\s*$/;

/** status_note から末尾の注記と前後の空白を外し、結果の語だけにする */
export function stripResultNoteSuffix(statusNote: string): string {
  let resultWord = statusNote.trim();
  // 注記が2つ続く場合（「認定（…）（…）」）にも対応する
  while (TRAILING_NOTE_PATTERN.test(resultWord)) {
    resultWord = resultWord.replace(TRAILING_NOTE_PATTERN, "");
  }
  return resultWord;
}

/**
 * 議決済みの議案のバッジに出す語を返す。
 * status_note が空、または想定していない語のときは「可決」「否決」に戻す
 */
export function getBillResultLabel(
  status: DecidedBillStatus,
  statusNote: string | null | undefined
): string {
  if (!statusNote) return FALLBACK_RESULT_LABELS[status];

  const resultWord = stripResultNoteSuffix(statusNote);
  // Object.hasOwn で確かめる（"constructor" のような語がプロトタイプに当たらないように）
  return Object.hasOwn(RESULT_LABELS[status], resultWord)
    ? RESULT_LABELS[status][resultWord]
    : FALLBACK_RESULT_LABELS[status];
}
