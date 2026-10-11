import {
  Building2,
  FileText,
  HandHeart,
  HardHat,
  JapaneseYen,
  type LucideIcon,
  Map as MapIcon,
  Megaphone,
  Network,
  PieChart,
  Scale,
  Send,
  Users,
  Zap,
} from "lucide-react";
import type { BillWithContentLite } from "../../../shared/types";
import {
  extractBillNumberLabel,
  formatSubmittedYearMonth,
  pickCoverVariant,
} from "../../../shared/utils/bill-cover";
import { getBillDateLabel } from "../../../shared/utils/bill-status";

interface BillCoverProps {
  // 本文（content）は使わないため軽量版で受ける（フル版もそのまま渡せる）
  bill: BillWithContentLite;
  /** CompactBillCard の小サムネイル枠用。タイポグラフィを省きアイコンのみ表示する */
  compact?: boolean;
  /** 議案詳細の見出し用。カバーが高いので、番号とアイコンを大きくして左下に寄せる */
  hero?: boolean;
}

// カテゴリ系統（globals.css の `--color-cover-{family}-{1|2|3}` トークンに対応）
type CoverFamily =
  | "terracotta"
  | "slate"
  | "sage"
  | "ochre"
  | "brown"
  | "beige";

// カテゴリ（bill.tags[0].label）→ 背景系統・アイコンの対応表
// カテゴリ判定は packages/seed/tagawa/build-csv.ts の categorize() と揃える
const CATEGORY_STYLE: Record<
  string,
  { family: CoverFamily; icon: LucideIcon }
> = {
  予算: { family: "terracotta", icon: JapaneseYen },
  決算: { family: "terracotta", icon: PieChart },
  条例: { family: "slate", icon: Scale },
  人事: { family: "sage", icon: Users },
  意見書: { family: "ochre", icon: Send },
  決議: { family: "ochre", icon: Megaphone },
  "契約・工事": { family: "brown", icon: HardHat },
  "財産処分・取得": { family: "brown", icon: Building2 },
  一部事務組合: { family: "beige", icon: Network },
  専決処分承認: { family: "beige", icon: Zap },
  "計画・構想": { family: "beige", icon: MapIcon },
  "請願・陳情": { family: "beige", icon: HandHeart },
  その他: { family: "beige", icon: FileText },
};

// 未知のタグ（カテゴリ判定外）の場合のフォールバック
const DEFAULT_CATEGORY_STYLE = { family: "beige" as const, icon: FileText };

// 系統×濃淡3段階の色面クラス（pickCoverVariantの結果に対応。
// globals.css の --color-cover-{family}-{1|2|3} トークンから自動生成される）
const COVER_CLASSES: Record<CoverFamily, readonly [string, string, string]> = {
  terracotta: [
    "bg-cover-terracotta-1",
    "bg-cover-terracotta-2",
    "bg-cover-terracotta-3",
  ],
  slate: ["bg-cover-slate-1", "bg-cover-slate-2", "bg-cover-slate-3"],
  sage: ["bg-cover-sage-1", "bg-cover-sage-2", "bg-cover-sage-3"],
  ochre: ["bg-cover-ochre-1", "bg-cover-ochre-2", "bg-cover-ochre-3"],
  brown: ["bg-cover-brown-1", "bg-cover-brown-2", "bg-cover-brown-3"],
  beige: ["bg-cover-beige-1", "bg-cover-beige-2", "bg-cover-beige-3"],
};

const VARIANT_COUNT = 3;

// カード用と、議案詳細の見出し（hero）用の大きさ
const SIZE_CLASSES = {
  card: {
    icon: "-right-4 -bottom-4 h-20 w-20 md:h-24 md:w-24",
    body: "justify-center gap-1 px-5",
    prefix: "text-sm",
    number: "text-2xl md:text-3xl",
    fallback: "text-xl md:text-2xl",
    date: "text-xs",
  },
  hero: {
    icon: "-right-6 -bottom-6 h-36 w-36 md:h-44 md:w-44",
    body: "justify-end gap-1.5 px-5 pb-6 md:px-8 md:pb-8",
    prefix: "text-base md:text-lg",
    number: "text-4xl md:text-5xl",
    fallback: "text-3xl md:text-4xl",
    date: "text-sm",
  },
} as const;

/**
 * 「議案第59号」のような番号ラベルを接頭辞（議案）と番号部分（第59号）に分割する
 * 分割できない場合は番号部分のみにラベル全体を入れる
 */
function splitNumberLabel(label: string): { prefix: string; number: string } {
  const match = /^(.+?)(第\d+号)$/.exec(label);
  if (!match) return { prefix: "", number: label };
  return { prefix: match[1], number: match[2] };
}

/**
 * 議案カード用の動的カバー
 * カテゴリ共通の静的サムネイル画像の代わりに、議案ごとに見た目が決定的に
 * 変化する背景・アイコン・タイポグラフィのみで構成されたカバーを描画する
 */
export function BillCover({
  bill,
  compact = false,
  hero = false,
}: BillCoverProps) {
  const categoryLabel = bill.tags[0]?.label;
  const categoryStyle =
    (categoryLabel && CATEGORY_STYLE[categoryLabel]) || DEFAULT_CATEGORY_STYLE;
  const variant = pickCoverVariant(bill.id, VARIANT_COUNT);
  const coverClass = COVER_CLASSES[categoryStyle.family][variant];
  const Icon = categoryStyle.icon;

  if (compact) {
    return (
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden ${coverClass} bg-cover-dots`}
      >
        <Icon aria-hidden className="h-7 w-7 text-mirai-text/30" />
      </div>
    );
  }

  const size = hero ? SIZE_CLASSES.hero : SIZE_CLASSES.card;
  const numberLabel = extractBillNumberLabel(bill.name);
  const parsedNumberLabel = numberLabel ? splitNumberLabel(numberLabel) : null;
  const submittedLabel = bill.submitted_date
    ? formatSubmittedYearMonth(bill.submitted_date)
    : null;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${coverClass} bg-cover-dots`}
    >
      <Icon
        aria-hidden
        className={`absolute text-mirai-text/15 ${size.icon}`}
      />
      <div className={`relative flex h-full flex-col ${size.body}`}>
        {parsedNumberLabel ? (
          <p className="font-mirai-serif text-mirai-text">
            {parsedNumberLabel.prefix && (
              <span className={`block font-medium ${size.prefix}`}>
                {parsedNumberLabel.prefix}
              </span>
            )}
            <span className={`block font-bold ${size.number}`}>
              {parsedNumberLabel.number}
            </span>
          </p>
        ) : (
          <p
            className={`font-mirai-serif font-bold text-mirai-text ${size.fallback}`}
          >
            {categoryLabel ?? "議案"}
          </p>
        )}
        {submittedLabel && (
          <p className={`text-mirai-text-note ${size.date}`}>
            {/* submitted_date は議決済みなら議決日なので、状態に合わせた語を添える */}
            {submittedLabel} {getBillDateLabel(bill.status)}
          </p>
        )}
      </div>
    </div>
  );
}
