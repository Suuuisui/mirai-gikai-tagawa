/**
 * 田川市議会 実データ → seed:csv 用CSV変換スクリプト【田川市専用】
 *
 * `packages/seed/tagawa/data/sessions.json`（scrape.ts が田川市公式サイトから
 * 生成した会期・議案の事実データ）を、`pnpm seed:csv`
 * （`packages/seed/csv/import-csv.ts`）が読み込む形式のCSVへ変換し、
 * `packages/seed/csv/data/` 配下に書き出す。
 *
 * 議案の平易な解説文はAI生成せず、公式サイト記載の事実（議案番号・件名・
 * 提出者区分・議決結果・議決日）のみを転記する方針のため、bill_contents の
 * content は事実を列挙したMarkdownのみを機械的に生成する。
 *
 * 実行方法:
 *   pnpm --filter @mirai-gikai/seed tagawa:build-csv
 *
 * 実行後、`pnpm seed:csv` でローカルDBに投入できる。
 */

import fs from "node:fs";
import path from "node:path";
import {
  loadTagawaSessions,
  type BillSource,
  type Proposer,
} from "./source-data";
import { BILL_DESCRIPTIONS, billDescriptionKey } from "./bill-descriptions";
import { BATCH_B_OVERRIDES } from "./bill-descriptions-batch-b";
import { BATCH_C_OVERRIDES } from "./bill-descriptions-batch-c";
import { uuidv5 } from "./uuidv5";

// みらい議会＠田川市のシードID採番専用の名前空間UUID（ランダム生成した固定値）。
// 変更すると全ID（bill_id等）が別値になり `/bills/{id}` のURLが全て変わるため、
// 一度決めたら変更しないこと。
const TAGAWA_SEED_NAMESPACE = "bca7c2b2-c956-4dc0-905c-7c6e312deb68";

/** namespace固定でuuidv5を呼び出すための薄いラッパー */
function seedId(name: string): string {
  return uuidv5(TAGAWA_SEED_NAMESPACE, name);
}

// 並列バッチ（batch-b/batch-c）の解説文を統合する。担当会期が排他的なため
// キーの衝突は発生しない想定（build-csv実行時にログで確認する）。
const ALL_BILL_DESCRIPTIONS = {
  ...BILL_DESCRIPTIONS,
  ...BATCH_B_OVERRIDES,
  ...BATCH_C_OVERRIDES,
};

const CSV_DATA_DIR = path.join(import.meta.dirname, "../csv/data");

// 直近の会期（最新）を「開催中」として扱う会期一覧トップの強調表示に利用する。
// ※ 実際の会期日程は既に終了しているが、次回会期が開会するまでの間、
//   サイト上で「直近の田川市議会」として案内するための運用上のフラグ。
const ACTIVE_SESSION_KEY = "r8-4-teirei";

// 議案の議決結果表記 → bills.status（DBスキーマの enum は
// enacted/rejected 等の粗い区分のみのため、詳細な議決結果は status_note に別途保持する）
// - 議決結果が不明な場合は introduced（提出済み）
// - 継続審議（閉会中審査に付されたもの）は in_originating_house（委員会審議中）
function resultToStatus(
  resultLabel: string | null
): "enacted" | "rejected" | "introduced" | "in_originating_house" {
  if (resultLabel === null) return "introduced";
  if (/継続審議|継続審査/.test(resultLabel)) return "in_originating_house";
  // 否定形を先に判定する（「不認定」が「認定」に一致しないように）
  if (/不認定|不同意|不採択|否決/.test(resultLabel)) return "rejected";
  if (
    /原案可決|修正可決|修正議決|可決|同意|承認|認定|採択|適任|懲罰を科す/.test(
      resultLabel
    )
  ) {
    return "enacted";
  }
  throw new Error(`未知の議決結果です: ${resultLabel}`);
}

const PROPOSER_LABEL: Record<Proposer, string> = {
  mayor: "市長提出",
  member: "議員提出",
  committee: "委員会提出",
};

// categorize() が判定するタグ種別の一覧（FEATURED_TAG_CONFIG のキーをこの型に
// 制約することで、タグ名の変更時に両者が食い違うことをコンパイル時に検出する）
type CategoryLabel =
  | "専決処分承認"
  | "決算"
  | "請願・陳情"
  | "予算"
  | "条例"
  | "人事"
  | "意見書"
  | "決議"
  | "契約・工事"
  | "財産処分・取得"
  | "一部事務組合"
  | "計画・構想"
  | "その他";

// 件名から議案の種別タグを機械的に判定する（AI生成ではなく単純なパターンマッチ）
function categorize(bill: BillSource): CategoryLabel {
  const { billNumberLabel, title } = bill;
  if (billNumberLabel?.startsWith("報告")) return "専決処分承認";
  if (billNumberLabel?.startsWith("認定")) return "決算";
  if (
    billNumberLabel?.startsWith("陳情") ||
    billNumberLabel?.startsWith("請願")
  ) {
    return "請願・陳情";
  }
  if (title.includes("予算")) return "予算";
  if (title.includes("条例")) return "条例";
  if (
    billNumberLabel?.startsWith("諮問") ||
    /選任|任命|推薦/.test(title)
  ) {
    return "人事";
  }
  if (/意見書/.test(title)) return "意見書";
  if (/決議/.test(title)) return "決議";
  if (/契約|工事/.test(title)) return "契約・工事";
  if (/財産/.test(title)) return "財産処分・取得";
  if (/組合|規約/.test(title)) return "一部事務組合";
  if (/計画|構想/.test(title)) return "計画・構想";
  return "その他";
}

// ホームページのタグ横断セクションに表示するタグと、その優先度・説明文
// （団体運営者の判断として選定済み。優先度は小さい数字ほど上位表示）
const FEATURED_TAG_CONFIG: Partial<
  Record<CategoryLabel, { priority: number; description: string }>
> = {
  決議: {
    priority: 1,
    description:
      "議長・市長への不信任、辞職勧告など、政治的に注目度の高い決議案",
  },
  予算: { priority: 2, description: "毎年度の市の使いみちを決める予算案" },
  決算: {
    priority: 3,
    description: "前年度の税金の使われ方が適切だったかを審査する決算案",
  },
  条例: { priority: 4, description: "市民生活に直接関わるルールを定める条例改正" },
  意見書: {
    priority: 5,
    description: "国・県などへ田川市議会としての意見を提出する意見書",
  },
};

// カテゴリ別のサムネイル画像（`web/public/img/bill-thumbnails/` に配置済みの静的イラスト）。
// 議案ごとに個別のAI生成画像は用意せず、カテゴリ共通の画像を割り当てる
// （コスト・運用負荷を抑えるため。将来的にadmin画面から個別画像への差し替えは可能）
const CATEGORY_THUMBNAIL: Record<CategoryLabel, string> = {
  予算: "/img/bill-thumbnails/budget.webp",
  条例: "/img/bill-thumbnails/ordinance.webp",
  "計画・構想": "/img/bill-thumbnails/plan.webp",
  人事: "/img/bill-thumbnails/personnel.webp",
  意見書: "/img/bill-thumbnails/opinion.webp",
  決議: "/img/bill-thumbnails/resolution.webp",
  決算: "/img/bill-thumbnails/settlement.webp",
  一部事務組合: "/img/bill-thumbnails/union.webp",
  専決処分承認: "/img/bill-thumbnails/special-disposition.webp",
  "契約・工事": "/img/bill-thumbnails/contract.webp",
  財産処分・取得: "/img/bill-thumbnails/property.webp",
  "請願・陳情": "/img/bill-thumbnails/petition.webp",
  その他: "/img/bill-thumbnails/other.webp",
};

// 注目の議案として homepage に掲載する議案（事実として特筆性が高いものを選定。
// AI選定ではなく、決算不認定・否決など議決が割れた案件と当初予算を人手で選定）
// キーは `会期キー:議案番号ラベル`
const FEATURED_BILLS = new Set([
  "r7-5-rinji:議案第37号", // 第三者調査委員会設置条例の制定
  "r7-6-teirei:認定第1号", // 令和6年度一般会計決算（不認定）
  "r8-2-teirei:議案第7号", // 令和8年度一般会計予算
  "r8-4-teirei:議案第42号", // 農業委員会委員の任命（否決）
]);

function csvField(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers
        .map((h) =>
          csvField(row[h] as string | number | boolean | null | undefined ?? null)
        )
        .join(",")
    );
  }
  return `${lines.join("\n")}\n`;
}

function writeCsv(filename: string, headers: string[], rows: Array<Record<string, unknown>>) {
  const content = toCsv(headers, rows);
  fs.writeFileSync(path.join(CSV_DATA_DIR, filename), content, "utf-8");
  console.log(`✅ ${filename}: ${rows.length}件`);
}

function main() {
  const TAGAWA_SESSIONS = loadTagawaSessions();
  const dietSessionRows: Array<Record<string, unknown>> = [];
  const billRows: Array<Record<string, unknown>> = [];
  const billContentRows: Array<Record<string, unknown>> = [];
  const tagLabelToId = new Map<string, string>();
  const tagRows: Array<Record<string, unknown>> = [];
  const billsTagRows: Array<Record<string, unknown>> = [];

  for (const session of TAGAWA_SESSIONS) {
    const dietSessionId = seedId(`session:${session.key}`);
    const now = `${session.startDate}T00:00:00.000Z`;

    dietSessionRows.push({
      id: dietSessionId,
      name: session.name,
      start_date: session.startDate,
      end_date: session.endDate,
      created_at: now,
      updated_at: now,
      slug: session.key,
      shugiin_url: session.sourceUrl,
      is_active: session.key === ACTIVE_SESSION_KEY,
    });

    for (const bill of session.bills) {
      // 同一会期内で「議案番号ラベル（無ければ件名）+ 提出者」の組は一意
      // （提出者区分ごとに番号採番が独立しているため、番号のみでは同一会期内で
      // 重複するケースがある。例: r3-1-teirei の市長提出「議案第2号」と
      // 委員会提出「議案第2号」）
      const billKey = bill.billNumberLabel ?? bill.title;
      const billId = seedId(
        `bill:${session.key}:${billKey}:${bill.proposer}`
      );
      const status = resultToStatus(bill.resultLabel);
      const proposerLabel = PROPOSER_LABEL[bill.proposer];
      const name = bill.billNumberLabel
        ? `${bill.billNumberLabel}　${bill.title}`
        : bill.title;
      const decidedAt = `${bill.resolvedDate}T00:00:00.000Z`;
      const category = categorize(bill);

      billRows.push({
        id: billId,
        name,
        originating_house: "HR",
        status,
        status_note:
          bill.resultLabel === null
            ? "議決結果不明（出典に記載なし）"
            : bill.resultSource === "minutes"
              ? `${bill.resultLabel}（本会議会議録より自動抽出）`
              : bill.resultLabel,
        submitted_date: bill.resolvedDate,
        created_at: decidedAt,
        updated_at: decidedAt,
        thumbnail_url: CATEGORY_THUMBNAIL[category],
        publish_status: "published",
        is_featured: FEATURED_BILLS.has(`${session.key}:${bill.billNumberLabel}`),
        share_thumbnail_url: null,
        shugiin_url: session.sourceUrl,
        diet_session_id: dietSessionId,
        knowledge_source: null,
        use_knowledge_source_in_chat: false,
        // 提出時の議案説明資料PDF（公式サイト掲載分）。jsonbカラムのため
        // JSON文字列として出力する（無い議案はnull）
        explanation_material_urls: bill.explanationMaterialUrls
          ? JSON.stringify(bill.explanationMaterialUrls)
          : null,
      });

      let tagId = tagLabelToId.get(category);
      if (!tagId) {
        tagId = seedId(`tag:${category}`);
        tagLabelToId.set(category, tagId);
        const featuredConfig = FEATURED_TAG_CONFIG[category];
        tagRows.push({
          id: tagId,
          label: category,
          created_at: now,
          updated_at: now,
          featured_priority: featuredConfig?.priority ?? null,
          description: featuredConfig?.description ?? null,
        });
      }
      billsTagRows.push({
        bill_id: billId,
        tag_id: tagId,
        created_at: decidedAt,
      });

      const descriptionOverride =
        ALL_BILL_DESCRIPTIONS[
          billDescriptionKey(
            session.key,
            bill.billNumberLabel,
            bill.title,
            bill.proposer
          )
        ];

      const summary =
        descriptionOverride?.summary ??
        (bill.resultLabel
          ? `${session.name}に${proposerLabel}から提出され、${bill.resultLabel}となりました。（議決日: ${bill.resolvedDate}）`
          : `${session.name}に${proposerLabel}から提出されました。議決結果は出典ページに記載されていません。`);
      const content = [
        ...(descriptionOverride
          ? ["## 解説", "", descriptionOverride.body, ""]
          : []),
        "## 議案情報",
        "",
        `- **議案番号**: ${bill.billNumberLabel ?? "（番号なし）"}`,
        `- **件名**: ${bill.title}`,
        `- **提出者**: ${proposerLabel}`,
        `- **会期**: ${session.name}（${session.startDate}〜${session.endDate}）`,
        `- **議決結果**: ${bill.resultLabel ?? "出典に記載なし（不明）"}`,
        ...(bill.resultLabel ? [`- **議決日**: ${bill.resolvedDate}`] : []),
        "",
        "## 出典",
        "",
        `- [田川市議会「${session.name}の提出議案と議決結果」](${session.sourceUrl})（福岡県田川市公式サイト）`,
        ...(descriptionOverride?.source === "minutes"
          ? [
              "- [田川市議会 会議録検索システム](https://www.kensakusystem.jp/tagawa/index.html)の本会議録（提案理由説明・委員会審査結果報告・質疑・討論等）",
            ]
          : []),
        ...(descriptionOverride?.source === "explanation-materials"
          ? [
              "- 田川市議会公式サイトに掲載の議案説明資料（PDF）等の公開情報",
            ]
          : []),
        ...(bill.resultSource === "minutes"
          ? [
              "- 議決結果は[田川市議会 会議録検索システム](https://www.kensakusystem.jp/tagawa/index.html)の本会議録から自動抽出したものです",
            ]
          : []),
        "",
        ...(descriptionOverride?.source === "minutes"
          ? [
              "※ 上記の解説は、田川市議会 会議録検索システムで公開されている本会議録（提案理由説明・委員会審査結果報告・質疑・討論の内容）をもとに作成しています。",
            ]
          : descriptionOverride?.source === "explanation-materials"
            ? [
                "※ 上記の解説は、田川市議会公式サイトが公開する議案説明資料等の情報をもとに作成しています。本会議での質疑・討論の内容は、会議録が本稿執筆時点（2026年7月）で田川市議会 会議録検索システムに未公開のため反映していません。",
              ]
            : [
                "※ この内容は田川市議会事務局が公開する情報を基に事実のみを転記したものです。分かりやすい解説文のAIによる生成は行っていません。",
              ]),
      ].join("\n");

      const difficultyLevel = "normal";
      billContentRows.push({
        id: seedId(`bill_content:${billId}:${difficultyLevel}`),
        bill_id: billId,
        difficulty_level: difficultyLevel,
        title: bill.title,
        summary,
        content,
        created_at: decidedAt,
        updated_at: decidedAt,
      });
    }
  }

  writeCsv(
    "diet_sessions_rows.csv",
    [
      "id",
      "name",
      "start_date",
      "end_date",
      "created_at",
      "updated_at",
      "slug",
      "shugiin_url",
      "is_active",
    ],
    dietSessionRows
  );

  writeCsv(
    "tags_rows.csv",
    ["id", "label", "created_at", "updated_at", "featured_priority", "description"],
    tagRows
  );

  writeCsv(
    "bills_rows.csv",
    [
      "id",
      "name",
      "originating_house",
      "status",
      "status_note",
      "submitted_date",
      "created_at",
      "updated_at",
      "thumbnail_url",
      "publish_status",
      "is_featured",
      "share_thumbnail_url",
      "shugiin_url",
      "diet_session_id",
      "knowledge_source",
      "use_knowledge_source_in_chat",
      "explanation_material_urls",
    ],
    billRows
  );

  writeCsv(
    "bill_contents_rows.csv",
    ["id", "bill_id", "difficulty_level", "title", "summary", "content", "created_at", "updated_at"],
    billContentRows
  );

  writeCsv("bills_tags_rows.csv", ["bill_id", "tag_id", "created_at"], billsTagRows);

  // 田川市版では議案に紐づくインタビュー機能のデータは対象外（事実データのみ投入する）
  writeCsv(
    "interview_configs_rows.csv",
    ["id", "bill_id", "name", "status", "themes", "created_at", "updated_at"],
    []
  );
  writeCsv(
    "interview_questions_rows.csv",
    [
      "id",
      "interview_config_id",
      "question",
      "follow_up_guide",
      "quick_replies",
      "question_order",
      "created_at",
      "updated_at",
    ],
    []
  );

  console.log(
    `\n🎉 変換完了: 会期${dietSessionRows.length}件 / 議案${billRows.length}件 / タグ${tagRows.length}件`
  );
}

main();
