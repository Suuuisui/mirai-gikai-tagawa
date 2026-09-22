import type {
  GeneralQuestionRecord,
  QuestionOutlineItem,
} from "@mirai-gikai/shared/council/types";
import { compactMemberName } from "./group-questions";

/** 議員ページへリンクしてよいか判定するための情報 */
export interface MemberLinkContext {
  /** 議員ページがある姓 */
  memberNames: ReadonlySet<string>;
  /** 姓 → 公式名簿のフルネーム（名簿に無い姓は含まれない） */
  profileFullNameByFamily: ReadonlyMap<string, string>;
}

/**
 * 記録の氏名が指す議員のページがあればその姓（リンクのキー）を返す。
 * 姓の議員ページがあっても、公式名簿のフルネームと違う人物（同姓の別人）には
 * リンクしない。名簿に無い姓は姓だけで判断する
 */
export function resolveMemberPageKey(
  person: { familyName: string; name: string },
  context: MemberLinkContext
): string | null {
  if (!context.memberNames.has(person.familyName)) return null;
  const profileName = context.profileFullNameByFamily.get(person.familyName);
  if (
    profileName &&
    compactMemberName(profileName) !== compactMemberName(person.name)
  ) {
    return null;
  }
  return person.familyName;
}

/**
 * 公式ページの質問事項と項目数が一致する要旨だけを返す。
 * 一致しない要旨（PDFの区切りが違う）は項目に紐付けず、別枠で出す
 */
export function alignOutlineWithItems(
  record: Pick<GeneralQuestionRecord, "items" | "outline">
): QuestionOutlineItem[] | null {
  return record.outline && record.outline.length === record.items.length
    ? record.outline
    : null;
}
