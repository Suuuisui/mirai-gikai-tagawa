-- 議員提出議案・委員会提出議案の提出者・賛成者（連署議員）情報を保持するカラム。
-- 田川市公式サイト掲載の議案説明資料PDF冒頭に記載されている
-- 「提出者」「賛成者」の氏名を転記したもの（packages/seed/tagawa/bill-sponsors-data.ts）。
-- 市長提出議案や、PDFが公開されていない議案では null。
--
-- 形式例:
-- {
--   "proposers":  [{ "name": "髙瀬 冨士夫" }],
--   "supporters": [{ "name": "北山 隆之" }, ...],
--   "sourceUrl":  "https://www.joho.tagawa.fukuoka.jp/.../xxx.pdf"
-- }
alter table bills add column sponsors jsonb;

comment on column bills.sponsors is
  '議員・委員会提出議案の提出者・賛成者（公式PDFからの転記）。市長提出等は null';
