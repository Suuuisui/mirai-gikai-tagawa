/**
 * ページ内アンカーとジャンプナビの表示名。並び順はページの表示順。
 * セクションを増減するときはここを直せば、ヒーローのナビも追従する
 */
export const MAYOR_SECTIONS = {
  actions: { id: "actions", navLabel: "就任後にしたこと" },
  upcoming: { id: "upcoming", navLabel: "これからの予定" },
  background: { id: "background", navLabel: "市長交代の経緯" },
  election: { id: "election", navLabel: "選挙の結果" },
} as const;
