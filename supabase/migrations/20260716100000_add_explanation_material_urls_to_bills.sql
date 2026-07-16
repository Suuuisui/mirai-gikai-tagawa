-- 議案詳細に「提出時の説明資料（PDF）」リンクを表示するためのカラム。
-- 田川市公式サイト「提出議案と議決結果」ページに掲載される議案説明資料PDFの
-- ラベルとURLを [{"label": "...", "url": "..."}] 形式のjsonb配列で保持する。
-- 該当資料が無い議案は null。
alter table bills add column explanation_material_urls jsonb;

comment on column bills.explanation_material_urls is
  '提出時の議案説明資料PDF（{label, url}の配列）。公式サイト掲載分への外部リンク用';
