import "server-only";

import { BILLS_PER_TAG } from "@mirai-gikai/shared/top-page/config";
import {
  type BillForInterestScore,
  computeBillInterestScore,
  isControversialStatus,
  isHotTopicScore,
  sortByInterestKey,
} from "@mirai-gikai/shared/top-page/interest-score";
import { selectTagSectionBills } from "@mirai-gikai/shared/top-page/select-tag-section-bills";
import { findAllTagsWithBillCount } from "@/features/tags/server/repositories/tag-repository";
import { env } from "@/lib/env";
import type {
  CurationBill,
  FeaturedTagSection,
  HomepageData,
} from "../../shared/types";
import { findPublishedBillsForCuration } from "../repositories/homepage-repository";

/** 内部処理用: 表示用のCurationBillに、選定計算に使う情報を添えた形 */
type ScoredBill = {
  curation: CurationBill;
  isFeatured: boolean;
  featuredPriority: number | null;
  /** selectTagSectionBills に渡すための素の形 */
  scoreInput: BillForInterestScore & { id: string };
  /** タグIDごとのピン留め順位（bills_tags.pinned_priority。未設定はnull） */
  pinnedPriorityByTagId: Map<string, number | null>;
};

/**
 * トップページ編集画面用のデータを組み立てる。
 * タグ枠の「自動選定3件」は、webのトップページ本体と同じ共有ロジック
 * （selectTagSectionBills: 注目の議案を除外→興味度スコア順→上位N件）で
 * 計算するため、保存後に公開サイトへ出る内容と一致する。
 */
export async function loadHomepageData(): Promise<HomepageData> {
  const [billRows, tagRows] = await Promise.all([
    findPublishedBillsForCuration(),
    findAllTagsWithBillCount(),
  ]);

  // スコア計算中に時刻がブレないよう一度だけ取得する
  const now = new Date();

  const scoredBills: ScoredBill[] = billRows.map((row) => {
    // rowは select 済みの形のまま BillForInterestScore を構造的に満たす
    const scoreInput: BillForInterestScore & { id: string } = row;
    const content = row.bill_contents[0] ?? null;
    const interestScore = computeBillInterestScore(scoreInput, now);

    const tags = row.bills_tags
      .map((bt) => bt.tags)
      .filter((tag): tag is NonNullable<typeof tag> => tag !== null);

    const pinnedPriorityByTagId = new Map(
      row.bills_tags
        .filter((bt) => bt.tags !== null)
        .map((bt) => [bt.tags?.id ?? "", bt.pinned_priority])
    );

    return {
      curation: {
        id: row.id,
        name: row.name,
        title: content?.title ?? null,
        statusNote: row.status_note,
        isControversial: isControversialStatus(row.status_note),
        submittedDate: row.submitted_date?.slice(0, 10) ?? null,
        sessionName: row.diet_sessions?.name ?? null,
        tags,
        interestScore,
        isHot: isHotTopicScore(interestScore, row.submitted_date, now),
      },
      isFeatured: row.is_featured,
      featuredPriority: row.featured_priority,
      scoreInput,
      pinnedPriorityByTagId,
    };
  });

  // 注目の議案: featured_priority順（nullは末尾）
  const featuredBills = scoredBills
    .filter((bill) => bill.isFeatured)
    .sort(
      (a, b) =>
        (a.featuredPriority ?? Number.MAX_SAFE_INTEGER) -
        (b.featuredPriority ?? Number.MAX_SAFE_INTEGER)
    )
    .map((bill) => bill.curation);

  // 追加候補: 未featuredの公開議案を興味度スコア降順で
  const candidateBills = sortByInterestKey(
    scoredBills.filter((bill) => !bill.isFeatured),
    (bill) => ({
      score: bill.curation.interestScore,
      submittedDate: bill.scoreInput.submitted_date,
      id: bill.curation.id,
    })
  ).map((bill) => bill.curation);

  // タグ別セクション: featured_priorityが設定されたタグ（設定順）に、
  // webと同じ選定ロジックでプレビュー3件を割り当てる。
  // 除外対象はwebのトップページ同様「注目の議案として表示される議案」
  const featuredBillIds = new Set(featuredBills.map((bill) => bill.id));
  const featuredTagSections: FeaturedTagSection[] = tagRows
    .filter((tag) => tag.featured_priority !== null)
    .sort((a, b) => (a.featured_priority ?? 0) - (b.featured_priority ?? 0))
    .map((tag) => {
      const rows = scoredBills
        .filter((bill) => bill.curation.tags.some((t) => t.id === tag.id))
        .map((bill) => ({
          bills: bill.scoreInput,
          curation: bill.curation,
          // このタグとの紐付け行に設定されたピン留め順位（タグごとに独立）
          pinned_priority: bill.pinnedPriorityByTagId.get(tag.id) ?? null,
        }));

      const selectedRows = selectTagSectionBills(
        rows,
        featuredBillIds,
        BILLS_PER_TAG
      );
      const previewBills = selectedRows.map((row) => row.curation);
      const previewIds = new Set(previewBills.map((bill) => bill.id));

      const pinnedBillIds = selectedRows
        .filter((row) => row.pinned_priority != null)
        .map((row) => row.curation.id);

      // ピン留め候補: このタグの公開議案のうち、枠に出ておらず
      // 「注目の議案」にも入っていないもの（興味度スコア降順）
      const pinCandidates = sortByInterestKey(
        rows.filter(
          (row) =>
            !previewIds.has(row.curation.id) &&
            !featuredBillIds.has(row.curation.id)
        ),
        (row) => ({
          score: row.curation.interestScore,
          submittedDate: row.bills.submitted_date,
          id: row.curation.id,
        })
      ).map((row) => row.curation);

      return {
        id: tag.id,
        label: tag.label,
        description: tag.description,
        billCount: tag.bills_tags[0]?.count ?? 0,
        previewBills,
        pinnedBillIds,
        pinCandidates,
        isHot: previewBills.some((bill) => bill.isHot),
      };
    });

  const hiddenTags = tagRows
    .filter((tag) => tag.featured_priority === null)
    .map((tag) => ({
      id: tag.id,
      label: tag.label,
      billCount: tag.bills_tags[0]?.count ?? 0,
    }));

  return {
    featuredBills,
    candidateBills,
    featuredTagSections,
    hiddenTags,
    webUrl: env.webUrl || null,
  };
}
