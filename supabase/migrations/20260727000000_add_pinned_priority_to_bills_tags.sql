-- トップページのタグ別セクションで議案を固定表示（ピン留め）するための列。
-- NULL = 自動選定（興味度スコア順）。数値が小さいほど先頭に表示される。
-- タグごとに独立した並び（同じ議案でもタグAでは固定・タグBでは自動があり得る）。
ALTER TABLE bills_tags ADD COLUMN pinned_priority INTEGER;

COMMENT ON COLUMN bills_tags.pinned_priority IS 'トップページのタグ枠で固定表示する優先順位（1が先頭）。NULLは自動選定';
