-- 委員会記録（committee_meetings）の出典に「minutes」を追加する。
--
-- minutes = 田川市議会 会議録検索システムで公開されている本会議の会議録。
-- 本会議の記録は、会議録が公開されるまで公式YouTube中継の文字起こし（youtube）をもとにし、
-- 会議録が公開されたら同じ行（同じ id = 同じURL）のまま minutes に置き換える。
-- 既存の値（disclosure: 情報開示請求で入手した文書 / youtube: 中継の文字起こし）はそのまま。

ALTER TABLE committee_meetings
    DROP CONSTRAINT IF EXISTS committee_meetings_source_type_check;

ALTER TABLE committee_meetings
    ADD CONSTRAINT committee_meetings_source_type_check
    CHECK (source_type IN ('disclosure', 'youtube', 'minutes'));

COMMENT ON COLUMN committee_meetings.source_type IS
    '記録のもと: minutes（会議録検索システムの本会議の会議録）/ youtube（公式YouTube中継の文字起こし）/ disclosure（情報開示請求で入手した文書）';
