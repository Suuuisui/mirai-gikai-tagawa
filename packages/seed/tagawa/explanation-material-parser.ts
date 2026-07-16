/**
 * 田川市議会「提出議案と議決結果」ページに掲載される議案説明資料PDFの
 * リンクテキストを議案番号（billNumberLabel）に突合するための純粋関数群
 * 【田川市専用】
 *
 * `scrape-explanation-materials.ts` から利用する。外部I/Oを持たないため
 * 同階層の `explanation-material-parser.test.ts` で単体テストする。
 *
 * リンクテキストの実例（2026年7月時点、令和元年12月〜令和8年6月の
 * 全30会期分のページを実地確認して確定したパターン）:
 *   - "59号　説明資料"                      → 議案第59号
 *   - "60号　厚生委員会"                    → 議案第60号（委員会資料）
 *   - "1号_総務文教委員会"                  → 議案第1号（アンダースコア区切り）
 *   - "議員提出議案第16号"                  → 議員提出議案第16号（明示的な提出者区分つき）
 *   - "議員提出議案 第2号"                  → 空白入りの表記ゆれ
 *   - "議員提出第19号"                      → 「議案」を省略した表記ゆれ
 *   - "委員会提出議案第5号"                 → billNumberLabelには提出者区分が
 *                                             含まれないページもあるため、突合時に
 *                                             「議案第5号」へフォールバックする
 *   - "諮問1号"（「第」が無い表記のページもある）
 *   - "63号、65-71号　説明資料"             → 複数号のまとめ資料（範囲展開）
 *   - "13、14号_説明資料"                   → 複数号のまとめ資料（カンマ区切り）
 *   - "55号-57号　説明資料"                 → 号をまたぐ範囲表記
 *   - "議案第62～67号_説明資料"             → 種別プレフィックスつきの範囲表記
 *   - "16～18号説明資料"                    → 全角チルダの範囲表記
 *   - "35,36,37説明資料"                    → 「号」を省略した列挙（直後の「説明資料」で判定）
 *   - "議案説明資料（28号）"                → 号数が括弧内にある表記（令和8年以降のページ）
 *   - "補正予算書"、"議決結果"、"賛否の分かれた案件" 等 → 号数を含まない一般資料
 *     （突合対象外。呼び出し側で警告として扱う）
 */

/** 範囲表記に使われるダッシュ類（半角/全角ハイフン・チルダ・波ダッシュ等） */
const DASH_CHARS = "\\-－‐−〜～~";

/** 文字列先頭の号数リスト（数字・区切り記号・空白・「号」の連なり） */
const NUMBER_LIST_HEAD_RE = new RegExp(
  `^[\\s　]*(\\d[\\d、,・${DASH_CHARS}\\s　号]*)`
);

/** 号数リストの直後にあれば議案番号と判断できる文脈語（「号」省略表記の救済用） */
const NUMBER_CONTEXT_RE = /^[_\s　]*(?:説明資料|資料|委員会)/;

/** 議案種別プレフィックス（表記ゆれの別名 → billNumberLabel上の正式名） */
const PREFIX_ALIASES: Record<string, string> = {
  議員提出議案: "議員提出議案",
  委員会提出議案: "委員会提出議案",
  議員提出: "議員提出議案",
  委員会提出: "委員会提出議案",
  議案: "議案",
  報告: "報告",
  認定: "認定",
  諮問: "諮問",
  同意: "同意",
  発議: "発議",
};

const PREFIX_PATTERN =
  "議員提出議案|委員会提出議案|議員提出|委員会提出|議案|報告|認定|諮問|同意|発議";

/** テキスト先頭の種別プレフィックス（直後に数字が続く場合のみマッチ） */
const LEADING_PREFIX_RE = new RegExp(
  `^[\\s　]*(${PREFIX_PATTERN})[\\s　]*第?[\\s　]*(?=\\d)`
);

/** 種別なしで「第」から始まる表記（例: "第69-72、74、75号説明資料"） */
const LEADING_DAI_RE = /^[\s　]*第[\s　]*(?=\d)/;

/** 文中の明示的なラベル表記（例: "…議案第33号（PDF…）"） */
const FULL_FORM_RE = new RegExp(
  `(${PREFIX_PATTERN})[\\s　]*第?[\\s　]*(\\d+)[\\s　]*号`,
  "g"
);

/** 「議案説明資料（28号）」のように号数が括弧内にある形式 */
const PARENTHESIZED_NUMBER_RE = /[（(]\s*(\d+)\s*号\s*[）)]/g;

/** 数字文字列を半角化する（scrape.tsのnormalizeDigitsと同等のロジック） */
function toHalfWidthDigits(s: string): string {
  return s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
}

/**
 * 号数リスト文字列を数値配列へ展開する。
 * "63、65-71" → [63,65,...,71] / "55号-57号" → [55,56,57] / "76‐77" → [76,77]
 */
function expandNumberList(src: string): number[] {
  const cleaned = src.replace(/[号\s　]/g, "");
  const rangeRe = new RegExp(`^(\\d+)[${DASH_CHARS}](\\d+)$`);
  const numbers: number[] = [];
  for (const piece of cleaned.split(/[、,・]/)) {
    if (piece === "") continue;
    const range = rangeRe.exec(piece);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      for (let n = start; n <= end; n++) numbers.push(n);
    } else if (/^\d+$/.test(piece)) {
      numbers.push(Number(piece));
    }
  }
  return [...new Set(numbers)];
}

/**
 * 文字列先頭の号数リストを数値配列へ展開する。
 *
 * `requireContext` が true の場合、ファイルサイズ等の数字を誤検出しないよう、
 * リスト内に「号」を含むか、直後に「説明資料」等の文脈語が続くときのみ
 * 号数として扱う。種別プレフィックス（議案第〜等）を取り除いた後など、
 * 先頭の数字が議案番号だと確定している場合は false を渡す
 */
function extractLeadingNumbers(
  text: string,
  requireContext: boolean
): number[] {
  const m = NUMBER_LIST_HEAD_RE.exec(text);
  if (!m) return [];
  const head = m[1];
  if (
    requireContext &&
    !head.includes("号") &&
    !NUMBER_CONTEXT_RE.test(text.slice(m[0].length))
  ) {
    return [];
  }
  return expandNumberList(head);
}

/**
 * 文字列先頭の号数リストを数値配列へ展開する（公開API）。
 * 「63号、65-71号」→ [63,65,...,71]。号数と判断できない場合は空配列
 */
export function parseLeadingNumberList(text: string): number[] {
  return extractLeadingNumbers(toHalfWidthDigits(text), true);
}

export interface ParsedExplanationLink {
  /** 明示的な提出者区分・種別つきの議案ラベル（例: "議員提出議案第16号"） */
  fullFormLabels: string[];
  /** 種別が明示されていない号数（例: [63, 65, 66, ..., 71]）。突合時に種別を推測する */
  bareNumbers: number[];
}

/**
 * PDFリンクのテキストから議案番号の手がかりを抽出する。
 * 優先順位:
 * 1. 先頭の種別プレフィックスつき表記（範囲・複数号にも対応）
 * 2. 先頭が「第」で始まる号数リスト（種別なし）
 * 3. 先頭の号数リスト（種別なし）
 * 4. 文中の明示的なラベル表記
 * 5. 括弧内の号数
 *
 * 先頭の号数を文中のラベルより優先するのは、
 * 「2号 説明資料 … 予算書は議案第1号を参照」のように文中の議案番号が
 * 別議案への相互参照であるケースがあるため（リンクの主対象は常に先頭側）
 */
export function parseExplanationLinkText(
  rawText: string
): ParsedExplanationLink {
  const text = toHalfWidthDigits(rawText).trim();

  const prefixMatch = LEADING_PREFIX_RE.exec(text);
  if (prefixMatch) {
    const prefix = PREFIX_ALIASES[prefixMatch[1]];
    const numbers = extractLeadingNumbers(
      text.slice(prefixMatch[0].length),
      false
    );
    if (numbers.length > 0) {
      return {
        fullFormLabels: numbers.map((n) => `${prefix}第${n}号`),
        bareNumbers: [],
      };
    }
  }

  // 種別なしで「第」から始まる表記。「第」に続く数字は議案番号と確定できる
  const daiMatch = LEADING_DAI_RE.exec(text);
  if (daiMatch) {
    const numbers = extractLeadingNumbers(text.slice(daiMatch[0].length), false);
    if (numbers.length > 0) {
      return { fullFormLabels: [], bareNumbers: numbers };
    }
  }

  const leadingNumbers = extractLeadingNumbers(text, true);
  if (leadingNumbers.length > 0) {
    return { fullFormLabels: [], bareNumbers: leadingNumbers };
  }

  const fullFormLabels = [...text.matchAll(FULL_FORM_RE)].map(
    (m) => `${PREFIX_ALIASES[m[1]]}第${m[2]}号`
  );
  if (fullFormLabels.length > 0) {
    return { fullFormLabels: [...new Set(fullFormLabels)], bareNumbers: [] };
  }

  const parenNumbers = [...text.matchAll(PARENTHESIZED_NUMBER_RE)].map((m) =>
    Number(m[1])
  );
  if (parenNumbers.length > 0) {
    return { fullFormLabels: [], bareNumbers: [...new Set(parenNumbers)] };
  }

  return { fullFormLabels: [], bareNumbers: [] };
}

export interface ExplanationLink {
  label: string;
  url: string;
}

export interface UnmatchedExplanationLink extends ExplanationLink {
  reason: string;
}

export type MatchTargetProposer = "mayor" | "member" | "committee";

/**
 * 突合対象の議案（billNumberLabelがnullの議案は呼び出し側で除外する）。
 *
 * billNumberLabel は会期内で一意とは限らない。市長提出の「議案第44号」と
 * 議員提出の「議案第44号」が別採番で並存する会期（例: 令和7年9月定例会）が
 * あるため、突合結果は `id` で受け取る
 */
export interface MatchTargetBill {
  /** 呼び出し側が議案を特定するためのキー（突合対象の中で一意にすること） */
  id: string;
  billNumberLabel: string;
  proposer: MatchTargetProposer;
}

export interface MatchExplanationMaterialsResult {
  /** MatchTargetBill.id ごとに紐づいたPDF（同一議案に複数PDFがある場合は配列） */
  matched: Map<string, ExplanationLink[]>;
  /** 議案に紐づけられなかった・突合に注意が必要なリンク（警告用） */
  unmatched: UnmatchedExplanationLink[];
}

// 号数のみの表記から議案ラベルを推測する際に試す優先順位。
// 報告（専決処分）・認定（決算）・諮問等は「議案」と独立採番されるため、
// 同じ号数が複数種別に存在するページでは先頭に近い種別を優先する
const BARE_NUMBER_PREFIX_PRIORITY = [
  "議案",
  "認定",
  "報告",
  "諮問",
  "同意",
  "委員会提出議案",
  "議員提出議案",
  "発議",
  "陳情",
  "請願",
];

// 同一ラベルに複数の議案（提出者違い）が並存する場合の優先順位。
// ページ上では議員・委員会提出分は「議員提出議案第N号」等と明示されるのが
// 通例のため、明示のない表記は市長提出分と推定する
const PROPOSER_PRIORITY: MatchTargetProposer[] = [
  "mayor",
  "committee",
  "member",
];

function pickByProposer(
  candidates: MatchTargetBill[],
  preferred: MatchTargetProposer[]
): MatchTargetBill {
  for (const proposer of preferred) {
    const hit = candidates.find((b) => b.proposer === proposer);
    if (hit) return hit;
  }
  return candidates[0];
}

/**
 * ページから抽出したPDFリンク群を、会期の議案一覧に突合する。
 *
 * 1. 提出者区分つきの明示的なラベル（fullFormLabels）を先に処理する。
 *    同一議案への複数PDF（説明資料＋委員会資料等）は配列に追記する。
 *    - 「議員提出議案第N号」等のリンクは、billNumberLabelに提出者区分が
 *      保持されていないページ（当該会期のラベルが「議案第N号」のみ）に備え、
 *      提出者区分（proposer）が一致する議案へのフォールバックも試す。
 *    - 同一ラベルに複数の議案が並存する場合は、リンクの表記から推定される
 *      提出者（明示なし→市長提出）を優先して割り当てる。
 * 2. 続いて号数のみの表記（bareNumbers）を処理する。(1)で明示的に確保された
 *    議案は候補から除外することで、「議案第7号」（委員会提出）と「認定第7号」
 *    （決算）のように同じ号数を異なる種別で使い回すページでも正しい方に紐付く。
 *    それでも複数種別が候補に残る場合は優先順位の先頭に割り当てた上で
 *    警告として報告する
 */
export function matchExplanationMaterials(
  links: Array<ExplanationLink & { parsed: ParsedExplanationLink }>,
  bills: MatchTargetBill[]
): MatchExplanationMaterialsResult {
  const billsByLabel = new Map<string, MatchTargetBill[]>();
  for (const bill of bills) {
    const list = billsByLabel.get(bill.billNumberLabel) ?? [];
    list.push(bill);
    billsByLabel.set(bill.billNumberLabel, list);
  }
  const explicitlyClaimed = new Set<string>();
  const matched = new Map<string, ExplanationLink[]>();
  const unmatched: UnmatchedExplanationLink[] = [];

  const assign = (bill: MatchTargetBill, link: ExplanationLink) => {
    const entry = { label: link.label, url: link.url };
    const existing = matched.get(bill.id);
    if (existing) existing.push(entry);
    else matched.set(bill.id, [entry]);
  };

  // --- パス1: 提出者区分つきの明示的なラベル ---
  for (const link of links) {
    for (const fullLabel of link.parsed.fullFormLabels) {
      const aliasMatch = /^(議員提出|委員会提出)議案第(\d+)号$/.exec(fullLabel);
      const impliedProposer: MatchTargetProposer =
        aliasMatch === null
          ? "mayor"
          : aliasMatch[1] === "議員提出"
            ? "member"
            : "committee";

      const directHits = billsByLabel.get(fullLabel);
      if (directHits && directHits.length > 0) {
        const bill = pickByProposer(directHits, [
          impliedProposer,
          ...PROPOSER_PRIORITY,
        ]);
        assign(bill, link);
        explicitlyClaimed.add(bill.id);
        continue;
      }

      // ラベルに提出者区分が保持されていない会期向けのフォールバック
      // （proposerが一致する「議案第N号」に限る）
      const fallbackHit = aliasMatch
        ? (billsByLabel.get(`議案第${aliasMatch[2]}号`) ?? []).find(
            (b) => b.proposer === impliedProposer
          )
        : undefined;
      if (fallbackHit) {
        assign(fallbackHit, link);
        explicitlyClaimed.add(fallbackHit.id);
      } else {
        unmatched.push({
          label: link.label,
          url: link.url,
          reason: `該当する議案が見つかりません: ${fullLabel}`,
        });
      }
    }
  }

  // --- パス2: 号数のみの表記 ---
  for (const link of links) {
    if (link.parsed.fullFormLabels.length > 0) continue;
    if (link.parsed.bareNumbers.length === 0) {
      unmatched.push({
        label: link.label,
        url: link.url,
        reason: "リンクテキストから議案番号を抽出できませんでした",
      });
      continue;
    }
    for (const n of link.parsed.bareNumbers) {
      // 号数だけでは種別（議案/認定/報告...）を特定できないため、
      // 当該会期に実在する候補をすべて洗い出す（種別の優先順位つき）
      const allCandidates = BARE_NUMBER_PREFIX_PRIORITY.flatMap(
        (prefix) => billsByLabel.get(`${prefix}第${n}号`) ?? []
      );

      if (allCandidates.length === 0) {
        unmatched.push({
          label: link.label,
          url: link.url,
          reason: `該当する議案が見つかりません（${n}号）`,
        });
        continue;
      }

      // パス1で明示的に確保された議案は「号数のみの表記」の対象外とみなす。
      // 同じ号数のbareリンクが複数あっても除外はしない
      // （同一議案の委員会別資料は同じ議案に追記するのが正しいため）
      const candidates = allCandidates.filter(
        (b) => !explicitlyClaimed.has(b.id)
      );
      const pool = candidates.length > 0 ? candidates : allCandidates;
      const target = pickByProposer(pool, PROPOSER_PRIORITY);
      assign(target, link);

      const candidateLabels = [
        ...new Set(candidates.map((b) => b.billNumberLabel)),
      ];
      if (candidateLabels.length >= 2) {
        unmatched.push({
          label: link.label,
          url: link.url,
          reason: `複数の議案が候補になり得ます（${candidateLabels.join(", ")}）。${target.billNumberLabel}に割り当てました`,
        });
      }
    }
  }

  return { matched, unmatched };
}
