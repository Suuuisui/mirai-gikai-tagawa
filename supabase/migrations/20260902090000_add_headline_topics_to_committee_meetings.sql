-- 委員会会議録に「見出し」と「トピック」を追加する
--
-- 一覧では日付と委員会名しか手がかりが無く、何の話をした回なのかが分から
-- なかった。会議ごとに短い見出しを持たせ、さらに暮らしのテーマ（お金・
-- 子育て・ごみ・交通…）で横断して探せるようにする。
ALTER TABLE committee_meetings
    -- その会議で一番中身のあることを表す見出し（18〜28字程度の体言止め）
    ADD COLUMN headline TEXT,
    -- 暮らしのテーマ（web側 committee-topics.ts のidの配列。1会議1〜3個）
    ADD COLUMN topics JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN committee_meetings.headline IS '会議の内容を一言で表す見出し。一覧・詳細の主見出しに使う';
COMMENT ON COLUMN committee_meetings.topics IS '暮らしのテーマのid配列（money/welfare/education/waste/transport/city/health/industry/safety/cityhall/assembly/investigation）';
