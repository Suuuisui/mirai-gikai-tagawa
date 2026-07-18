-- トップページ「注目の議案」セクションの表示順を運営が明示指定するためのカラム。
-- tags.featured_priority と同じ規約（数値が小さいほど上位、NULLは対象外）。
-- 従来は submitted_date 降順の自動並びだったため、先頭に出す議案を選べなかった。
alter table bills add column featured_priority integer;

comment on column bills.featured_priority is
  '注目の議案の表示優先度（小さいほど上位）。is_featured=true の議案にのみ設定される';
