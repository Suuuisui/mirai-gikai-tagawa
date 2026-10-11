import "server-only";
import {
  buildCommitteeGroups,
  type CommitteeGroup,
  findCommitteeGroup,
} from "../../shared/utils/committee-groups";
import { getCommitteeMeetingListItems } from "./get-committee-meeting-list-items";

interface CommitteeGroupPageData {
  /** 表示する委員会 */
  group: CommitteeGroup;
  /** ほかの委員会・会議（種別→会議数の順。現在の委員会は含まない） */
  otherGroups: CommitteeGroup[];
}

/**
 * 委員会ごとのページ用に、ルートのパラメータ（slug か委員会名）から委員会と、
 * ほかの委員会の一覧を取得する。存在しない委員会・会議が1件も無い委員会は null。
 * 新しい問い合わせは足さず、キャッシュ済みの軽量な会議一覧を絞り込んで使う
 */
export async function getCommitteeGroupPageData(
  slugParam: string
): Promise<CommitteeGroupPageData | null> {
  const meetings = await getCommitteeMeetingListItems();
  const groups = buildCommitteeGroups(meetings);
  const group = findCommitteeGroup(groups, slugParam);
  if (!group) return null;
  return {
    group,
    otherGroups: groups.filter((other) => other !== group),
  };
}
