import { parseBillSources } from "@mirai-gikai/shared/council/bill-source-section";
import { OFFICIAL_MINUTES_TOP_URL } from "@mirai-gikai/shared/council/official-minutes";
import type { SourceRef } from "@/features/sources/shared/data/source-kinds";

const MINUTES_DETAIL = "会議録";
const BROADCAST_DETAIL = "本会議の中継";
const MATERIALS_DETAIL = "議案説明資料";

/**
 * 議案の本文の「## 出典」から、ページ上部に出す出典の一覧を作る。
 * 事実（番号・件名・結果）と解説とで、もとにした資料が違うことがあるので分けて示す。
 * 「## 出典」が無い本文（管理画面で書いた議案など）は空配列
 */
export function buildBillSourceRefs(
  content: string | null | undefined
): SourceRef[] {
  const parsed = parseBillSources(content);
  if (!parsed) return [];

  const refs: SourceRef[] = [];
  const resultIsOfficial = parsed.resultSource === "official";

  if (parsed.officialPage) {
    refs.push({
      kind: "official",
      detail: parsed.officialPage.isOngoing
        ? "提出議案のページ"
        : "議決結果のページ",
      scope:
        resultIsOfficial && !parsed.officialPage.isOngoing
          ? "議案番号・件名・提出者・議決結果"
          : "議案番号・件名・提出者",
      href: parsed.officialPage.url,
    });
  }

  if (parsed.resultSource === "minutes") {
    refs.push({
      kind: "official",
      detail: MINUTES_DETAIL,
      scope: "議決結果",
      href: OFFICIAL_MINUTES_TOP_URL,
    });
  } else if (parsed.resultSource === "broadcast") {
    refs.push({
      kind: "transcript",
      detail: BROADCAST_DETAIL,
      scope: "議決結果（議決結果のページが公開されたら照らし合わせます）",
    });
  }

  if (parsed.descriptionSource === "minutes") {
    refs.push({
      kind: "official",
      detail: MINUTES_DETAIL,
      scope: "解説（提案理由・質疑・討論・採決）",
      href: OFFICIAL_MINUTES_TOP_URL,
    });
  } else if (parsed.descriptionSource === "explanation-materials") {
    refs.push({
      kind: "official",
      detail: MATERIALS_DETAIL,
      scope: "解説（本会議の質疑・討論は含みません）",
    });
  } else if (parsed.descriptionSource === "broadcast") {
    refs.push(
      {
        kind: "official",
        detail: MATERIALS_DETAIL,
        scope: "解説（議案の内容）",
      },
      {
        kind: "transcript",
        detail: BROADCAST_DETAIL,
        scope: "解説（質疑・討論・採決のようす）",
      }
    );
  }

  return refs;
}
