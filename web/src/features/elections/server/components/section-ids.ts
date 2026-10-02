/**
 * 投票率ページのページ内アンカーとジャンプナビの表示名（ページの表示順）
 */
export const TURNOUT_SECTIONS = {
  myAge: { id: "my-age", navLabel: "あなたの年齢では" },
  ageBands: { id: "age-bands", navLabel: "年代別の投票率" },
  votes: { id: "votes", navLabel: "年代別の票の数" },
  composition: { id: "composition", navLabel: "投票した人の年代" },
  early: { id: "early-voting", navLabel: "期日前投票と当日" },
  precincts: { id: "precincts", navLabel: "投票区別" },
  history: { id: "history", navLabel: "これまでの推移" },
} as const;
