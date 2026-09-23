import "server-only";

import type { PetitionRecord } from "@mirai-gikai/shared/council/types";
import { cache } from "react";
import { getCommitteeMeetingListItems } from "@/features/committees/server/loaders/get-committee-meeting-list-items";
import { getCommitteeMeetingPetitionRefs } from "@/features/committees/server/loaders/get-committee-meeting-petition-refs";
import { PROFILE_FULL_NAME_BY_FAMILY } from "@/features/general-questions/server/loaders/get-general-questions";
import type { MemberLinkContext } from "@/features/general-questions/shared/utils/question-links";
import { getMemberNameSet } from "@/features/members/server/loaders/get-member-vote-data";
import { PETITIONS } from "../../shared/data/petitions-data";
import {
  matchPetitionMeetings,
  type PetitionMeetingMatch,
} from "../../shared/utils/petition-meetings";

/** 請願・陳情カードから議員ページ・委員会の記録へリンクするための解決表 */
export interface PetitionLinkContext extends MemberLinkContext {
  /** 委員会の記録があり、一覧ページのアンカーへ飛べる委員会名 */
  committeeNames: ReadonlySet<string>;
}

/** 請願・陳情の全記録（公式サイトから生成した静的データ、上程日の新しい順） */
export function getAllPetitions(): readonly PetitionRecord[] {
  return PETITIONS;
}

/** 元データはキャッシュ済みだが、1ページ内で複数回呼ばれるため React cache() で重複を省く */
export const getPetitionLinkContext = cache(
  async (): Promise<PetitionLinkContext> => {
    const [memberNames, meetings] = await Promise.all([
      getMemberNameSet(),
      getCommitteeMeetingListItems(),
    ]);
    return {
      memberNames,
      profileFullNameByFamily: PROFILE_FULL_NAME_BY_FAMILY,
      committeeNames: new Set(
        meetings.map((meeting) => meeting.committee_name)
      ),
    };
  }
);

/**
 * 請願・陳情ごとの「審査の経緯」（どの会議で審査され、何が決まったか）。
 * 委員会の記録の議題・要点と照合する。キャッシュ済みの記録を使うのでリクエストごとの DB 読みは無い
 */
export const getPetitionMeetingMatches = cache(
  async (): Promise<ReadonlyMap<string, PetitionMeetingMatch[]>> => {
    const refs = await getCommitteeMeetingPetitionRefs();
    return new Map(
      PETITIONS.map((record) => [
        record.id,
        matchPetitionMeetings(record, refs),
      ])
    );
  }
);
