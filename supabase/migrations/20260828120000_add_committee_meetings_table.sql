-- 委員会会議録テーブル
-- 情報開示請求で入手した委員会議事録（PDF由来）と、公式YouTube中継の
-- 自動字幕から起こしたテキストを、会議1回=1行で格納する
CREATE TABLE committee_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- 委員会名（例: 総務文教委員会、指名競争入札による建設工事発注に関する調査特別委員会）
    committee_name TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    -- 表示タイトル（例: 総務文教委員会（令和3年1月21日））
    title TEXT NOT NULL,
    -- 市民向けのやさしい要約（300字程度）
    summary TEXT,
    -- 議論の要点（文字列配列）
    key_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- 議題（文字列配列）
    agenda_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- 出席委員名（文字列配列）
    attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- 議事録・字幕起こしの本文テキスト
    minutes_text TEXT,
    -- データの出どころ: disclosure=情報開示請求で入手した文書 / youtube=公式中継の自動字幕
    source_type TEXT NOT NULL CHECK (source_type IN ('disclosure', 'youtube')),
    -- 出典の補足説明（開示決定日など）
    source_note TEXT,
    -- 公式YouTube中継のURL（判明している場合）
    youtube_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- 同一委員会・同一日・同一出典の重複投入を防ぐ（再実行可能なインポートのため）
    UNIQUE (committee_name, meeting_date, source_type)
);

CREATE INDEX idx_committee_meetings_committee_name ON committee_meetings (committee_name);
CREATE INDEX idx_committee_meetings_meeting_date ON committee_meetings (meeting_date DESC);

CREATE TRIGGER update_committee_meetings_updated_at BEFORE UPDATE ON committee_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE committee_meetings ENABLE ROW LEVEL SECURITY;

-- No policies are created, so all access is denied by default
-- Access will only be possible using Supabase Service Role Key from server-side

COMMENT ON TABLE committee_meetings IS '委員会の会議録。情報開示請求文書とYouTube中継字幕を出典として格納する。';
