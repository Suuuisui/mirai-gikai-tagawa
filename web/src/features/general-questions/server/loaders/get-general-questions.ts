import "server-only";

import type { GeneralQuestionRecord } from "@mirai-gikai/shared/council/types";
import { cache } from "react";
import { getCommitteeMeetingListItems } from "@/features/committees/server/loaders/get-committee-meeting-list-items";
import { getAllDietSessions } from "@/features/diet-sessions/server/loaders/get-all-diet-sessions";
import { getMemberNameSet } from "@/features/members/server/loaders/get-member-vote-data";
import { MEMBER_PROFILES } from "@/features/members/shared/data/member-profiles";
import { GENERAL_QUESTIONS } from "../../shared/data/general-questions-data";
import {
  groupQuestionsBySession,
  type QuestionSessionGroup,
  selectQuestionsForSession,
} from "../../shared/utils/group-questions";
import type { MemberLinkContext } from "../../shared/utils/question-links";

/** 本会議の一般質問を日ごとに1件で記録している委員会記録の委員会名 */
const QUESTION_DAY_RECORD_NAME = "本会議（一般質問）";

/**
 * 質問カードから他ページへリンクするための解決表。
 * 静的データ（会期キー・姓・質問日）を、DBのID（会期まとめ・議員ページ・
 * 本会議の記録）に結び付ける
 */
export interface QuestionLinkContext extends MemberLinkContext {
  /** 会期キー（slug） → 会期まとめページのID */
  sessionIdByKey: ReadonlyMap<string, string>;
  /** 質問日 → その日の本会議（一般質問）の記録ID */
  answerRecordIdByDate: ReadonlyMap<string, string>;
}

/** 一般質問の全記録（公式サイトから生成した静的データ） */
export function getAllGeneralQuestions(): readonly GeneralQuestionRecord[] {
  return GENERAL_QUESTIONS;
}

/** 静的データは変わらないので、会期ごとのまとまりはモジュール読み込み時に一度だけ作る */
const QUESTION_SESSION_GROUPS: readonly QuestionSessionGroup[] =
  groupQuestionsBySession(GENERAL_QUESTIONS);

/** 会期ごとの一般質問（新しい会期が先頭） */
export function getQuestionSessionGroups(): readonly QuestionSessionGroup[] {
  return QUESTION_SESSION_GROUPS;
}

/** 特定の会期（slug）の一般質問の人数。会期が無ければ0 */
export function countQuestionsForSession(sessionKey: string | null): number {
  return selectQuestionsForSession(GENERAL_QUESTIONS, sessionKey).length;
}

/** 公式名簿の姓 → フルネーム（同姓の別人にリンクしないための照合用） */
export const PROFILE_FULL_NAME_BY_FAMILY: ReadonlyMap<string, string> = new Map(
  Object.entries(MEMBER_PROFILES).map(([family, profile]) => [
    family,
    profile.fullName,
  ])
);

/**
 * リンク解決表を作る。元データはどれもキャッシュ済みだが、1ページ内で
 * 複数のセクションが呼ぶため React cache() でリクエスト内の重複を省く
 */
export const getQuestionLinkContext = cache(
  async (): Promise<QuestionLinkContext> => {
    const [sessions, memberNames, meetings] = await Promise.all([
      getAllDietSessions(),
      getMemberNameSet(),
      getCommitteeMeetingListItems(),
    ]);
    return {
      sessionIdByKey: new Map(
        sessions.flatMap((session) =>
          session.slug ? [[session.slug, session.id] as const] : []
        )
      ),
      memberNames,
      profileFullNameByFamily: PROFILE_FULL_NAME_BY_FAMILY,
      answerRecordIdByDate: new Map(
        meetings
          .filter(
            (meeting) => meeting.committee_name === QUESTION_DAY_RECORD_NAME
          )
          .map((meeting) => [meeting.meeting_date, meeting.id])
      ),
    };
  }
);
