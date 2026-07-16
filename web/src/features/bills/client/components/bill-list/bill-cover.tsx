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
import {
  extractBillNumberLabel,
  formatSubmittedYearMonth,
  pickCoverVariant,
} from "../../../shared/utils/bill-cover";
import type { BillWithContent } from "../../../shared/types";

interface BillCoverProps {
  bill: BillWithContent;
}

// カテゴリ系統（globals.css の `.bg-cover-{family}-{0|1|2}` ユーティリティに対応）
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

// 系統×濃淡3段階のグラデーションクラス（pickCoverVariantの結果に対応）
const GRADIENT_CLASSES: Record<CoverFamily, readonly [string, string, string]> =
  {
    terracotta: [
      "bg-cover-terracotta-0",
      "bg-cover-terracotta-1",
      "bg-cover-terracotta-2",
    ],
    slate: ["bg-cover-slate-0", "bg-cover-slate-1", "bg-cover-slate-2"],
    sage: ["bg-cover-sage-0", "bg-cover-sage-1", "bg-cover-sage-2"],
    ochre: ["bg-cover-ochre-0", "bg-cover-ochre-1", "bg-cover-ochre-2"],
    brown: ["bg-cover-brown-0", "bg-cover-brown-1", "bg-cover-brown-2"],
    beige: ["bg-cover-beige-0", "bg-cover-beige-1", "bg-cover-beige-2"],
  };

const VARIANT_COUNT = 3;

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
export function BillCover({ bill }: BillCoverProps) {
  const categoryLabel = bill.tags[0]?.label;
  const categoryStyle =
    (categoryLabel && CATEGORY_STYLE[categoryLabel]) || DEFAULT_CATEGORY_STYLE;
  const variant = pickCoverVariant(bill.id, VARIANT_COUNT);
  const gradientClass = GRADIENT_CLASSES[categoryStyle.family][variant];
  const Icon = categoryStyle.icon;

  const numberLabel = extractBillNumberLabel(bill.name);
  const parsedNumberLabel = numberLabel ? splitNumberLabel(numberLabel) : null;
  const submittedLabel = bill.submitted_date
    ? formatSubmittedYearMonth(bill.submitted_date)
    : null;

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${gradientClass} bg-cover-dots`}
    >
      <Icon
        aria-hidden
        className="absolute -right-4 -bottom-4 h-24 w-24 text-mirai-text/15 md:h-28 md:w-28"
      />
      <div className="relative flex h-full flex-col justify-center gap-1 px-5">
        {parsedNumberLabel ? (
          <p className="font-mirai-serif text-mirai-text">
            {parsedNumberLabel.prefix && (
              <span className="block text-sm font-medium">
                {parsedNumberLabel.prefix}
              </span>
            )}
            <span className="block text-3xl font-bold md:text-4xl">
              {parsedNumberLabel.number}
            </span>
          </p>
        ) : (
          <p className="font-mirai-serif text-2xl font-bold text-mirai-text md:text-3xl">
            {categoryLabel ?? "議案"}
          </p>
        )}
        {submittedLabel && (
          <p className="text-xs text-mirai-text-subtle">
            {submittedLabel} 提出
          </p>
        )}
      </div>
    </div>
  );
}
