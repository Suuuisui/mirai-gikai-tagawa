-- 議案詳細に「議員別の賛否」を表示するためのカラム。
-- 田川市議会が「賛否が分かれた案件」についてのみ議員17名分の賛否（○×表）を
-- 公式サイトに画像で公開しているため、その内容を転記したjsonbオブジェクトを
-- 保持する（{imageUrl, sourceUrl, notes?, entries: [{name, faction, vote}]}）。
-- 全会一致の議案は該当データが無いため null。
alter table bills add column member_votes jsonb;

comment on column bills.member_votes is
  '議員別賛否。賛否が分かれた案件のみ市が公開しているため、全会一致の議案は null';
