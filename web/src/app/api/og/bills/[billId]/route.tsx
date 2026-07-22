import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  Building2,
  FileText,
  HandHeart,
  HardHat,
  JapaneseYen,
  Map as MapIcon,
  Megaphone,
  Network,
  PieChart,
  Scale,
  Send,
  Users,
  Zap,
} from "lucide-static";
import { ImageResponse } from "next/og";
import {
  findPublishedBillById,
  findTagsByBillId,
} from "@/features/bills/server/repositories/bill-repository";
import {
  extractBillNumberLabel,
  formatSubmittedYearMonth,
  pickCoverVariant,
} from "@/features/bills/shared/utils/bill-cover";

// ============================================================
// デザイン定義（BillCoverの複製）
//
// 下記の配色・カテゴリ対応表・分割ロジックは
// web/src/features/bills/client/components/bill-list/bill-cover.tsx と
// web/src/app/globals.css の `--color-cover-*` / `--color-mirai-text*` トークンを
// 複製したもの。ImageResponse（Satori）はTailwindクラスやCSSカスタムプロパティ
// （globals.cssの@theme変数）を解決できないため、実値をここに直接転記している。
// 元ファイルのデザインを変更した場合は、このファイルも同期して更新すること。
// ============================================================

type CoverFamily =
  | "terracotta"
  | "slate"
  | "sage"
  | "ochre"
  | "brown"
  | "beige";

// カテゴリ（bill.tags[0].label）→ 背景系統・アイコンの対応表
// bill-cover.tsx の CATEGORY_STYLE と同一（アイコンはlucide-staticのSVG文字列。
// Satoriはlucide-reactのforwardRefコンポーネントを描画できないため）
const CATEGORY_STYLE: Record<string, { family: CoverFamily; icon: string }> = {
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

const DEFAULT_CATEGORY_STYLE = { family: "beige" as const, icon: FileText };

// globals.css `--color-cover-{family}-{1|2|3}` の実値
const GRADIENT_COLORS: Record<CoverFamily, readonly [string, string, string]> =
  {
    terracotta: ["#f5d9c8", "#edc0aa", "#e0a888"],
    slate: ["#dde3e8", "#c7d1d9", "#aebcc7"],
    sage: ["#dfe6dc", "#c9d4c3", "#b0c0a8"],
    ochre: ["#ede0c0", "#e3cd9c", "#d6ba7c"],
    brown: ["#e3d3c4", "#cdb69f", "#b49579"],
    beige: ["#ece8e1", "#ddd7cc", "#cac1b1"],
  };

// globals.css `--color-mirai-text` / `--color-mirai-text-subtle` の実値
const MIRAI_TEXT = "#1f2937";
const MIRAI_TEXT_SUBTLE = "#666666";
// bg-cover-dots のドット色（--color-mirai-text の8%不透明度）とアイコンの15%不透明度
const DOT_COLOR = "rgba(31, 41, 55, 0.08)";
const ICON_COLOR = "rgba(31, 41, 55, 0.15)";

const VARIANT_COUNT = 3;

/**
 * variant(0〜2)に対応する135度斜めグラデーション
 * bg-cover-{family}-{variant} ユーティリティクラスと同一の配色順
 */
function buildGradient(family: CoverFamily, variant: number): string {
  const colors = GRADIENT_COLORS[family];
  const from = colors[variant];
  const to = colors[(variant + 1) % colors.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}

/**
 * 「議案第59号」のような番号ラベルを接頭辞（議案）と番号部分（第59号）に分割する
 * bill-cover.tsx の splitNumberLabel と同一ロジック（非exportのため複製）
 */
function splitNumberLabel(label: string): { prefix: string; number: string } {
  const match = /^(.+?)(第\d+号)$/.exec(label);
  if (!match) return { prefix: "", number: label };
  return { prefix: match[1], number: match[2] };
}

// ============================================================
// フォント
//
// Satori（ImageResponse）は可変フォントのパースに失敗するため、google/fonts の
// ofl/notosansjp 可変フォントから fontTools.varLib.instancer で切り出した
// 静的ウェイト（400/700）のTTFを同梱している。
// ライセンスはOFL（同ディレクトリのOFL.txtを参照）。
// ============================================================

const FONT_DIR = join(process.cwd(), "src/assets/fonts/notosansjp");

let cachedFonts: { regular: Buffer; bold: Buffer } | null = null;

async function loadFonts(): Promise<{ regular: Buffer; bold: Buffer }> {
  if (cachedFonts) return cachedFonts;
  const [regular, bold] = await Promise.all([
    readFile(join(FONT_DIR, "NotoSansJP-Regular.ttf")),
    readFile(join(FONT_DIR, "NotoSansJP-Bold.ttf")),
  ]);
  cachedFonts = { regular, bold };
  return cachedFonts;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ billId: string }> }
) {
  const { billId } = await params;
  if (!billId) {
    return new Response("Missing billId", { status: 400 });
  }

  let bill: Awaited<ReturnType<typeof findPublishedBillById>>;
  let tags: Awaited<ReturnType<typeof findTagsByBillId>>;
  let fonts: { regular: Buffer; bold: Buffer };
  try {
    [bill, tags, fonts] = await Promise.all([
      findPublishedBillById(billId),
      findTagsByBillId(billId),
      loadFonts(),
    ]);
  } catch (error) {
    console.error("[OG/bills] failed to load bill or font:", error);
    return new Response("Internal server error", { status: 500 });
  }

  // 非公開/存在しない議案は404（デフォルトサムネイル判定はページ側の責務のため
  // ここでは常にBillCover相当のデザインを生成する）
  if (!bill) {
    return new Response("Bill not found", { status: 404 });
  }

  const categoryLabel = tags?.find((bt) => bt.tags !== null)?.tags?.label;
  const categoryStyle =
    (categoryLabel && CATEGORY_STYLE[categoryLabel]) || DEFAULT_CATEGORY_STYLE;
  const variant = pickCoverVariant(bill.id, VARIANT_COUNT);
  const gradient = buildGradient(categoryStyle.family, variant);

  // SVG文字列の色・線幅・サイズをBillCover相当に差し替えてdata URI化する
  const iconSvg = categoryStyle.icon
    .replace('stroke="currentColor"', `stroke="${ICON_COLOR}"`)
    .replace('stroke-width="2"', 'stroke-width="1.5"')
    .replace('width="24"', 'width="340"')
    .replace('height="24"', 'height="340"');
  const iconDataUri = `data:image/svg+xml,${encodeURIComponent(iconSvg)}`;

  const numberLabel = extractBillNumberLabel(bill.name);
  const parsedNumberLabel = numberLabel ? splitNumberLabel(numberLabel) : null;
  const submittedLabel = bill.submitted_date
    ? formatSubmittedYearMonth(bill.submitted_date)
    : null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        backgroundImage: gradient,
        fontFamily: "Noto Sans JP",
      }}
    >
      {/* ドットパターン装飾（bg-cover-dots相当） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage: `radial-gradient(${DOT_COLOR} 1px, transparent 1px)`,
          backgroundSize: "12px 12px",
        }}
      />

      {/* カテゴリアイコン（右下に大きく控えめに配置） */}
      {/* biome-ignore lint/performance/noImgElement: ImageResponse(Satori)内ではnext/imageは使えない */}
      <img
        src={iconDataUri}
        width={340}
        height={340}
        alt=""
        style={{ position: "absolute", right: -60, bottom: -60 }}
      />

      {/* サイト名（ブランド表記） */}
      <div
        style={{
          position: "absolute",
          top: 56,
          left: 96,
          display: "flex",
          fontSize: 30,
          fontWeight: 700,
          color: MIRAI_TEXT,
          opacity: 0.7,
        }}
      >
        みらい議会＠田川市
      </div>

      {/* メインテキスト */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          height: "100%",
          padding: "0 96px",
          gap: 20,
        }}
      >
        {parsedNumberLabel ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {parsedNumberLabel.prefix && (
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  fontWeight: 400,
                  color: MIRAI_TEXT,
                }}
              >
                {parsedNumberLabel.prefix}
              </div>
            )}
            <div
              style={{
                display: "flex",
                fontSize: 140,
                fontWeight: 700,
                color: MIRAI_TEXT,
                lineHeight: 1.05,
              }}
            >
              {parsedNumberLabel.number}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 700,
              color: MIRAI_TEXT,
            }}
          >
            {categoryLabel ?? "議案"}
          </div>
        )}
        {submittedLabel && (
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: MIRAI_TEXT_SUBTLE,
            }}
          >
            {submittedLabel} 提出
          </div>
        )}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fonts.regular,
          style: "normal",
          weight: 400,
        },
        {
          name: "Noto Sans JP",
          data: fonts.bold,
          style: "normal",
          weight: 700,
        },
      ],
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
