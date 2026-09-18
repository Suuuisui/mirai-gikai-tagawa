/**
 * 議案一覧（/bills）のURLクエリ名。
 * admin では「session」がインタビューセッションも指すため、会期は dietSession と書く
 */
export const BILL_DIET_SESSION_PARAM = "dietSession";

/** 会期の絞り込みを外す選択肢の値（URLには残さず、パラメータ自体を消す） */
export const ALL_DIET_SESSIONS = "all";
