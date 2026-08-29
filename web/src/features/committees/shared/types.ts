/** 委員会会議録のデータ出典 */
export type CommitteeMeetingSourceType = "disclosure" | "youtube";

/** 委員会の会議録（1回の会議 = 1レコード） */
export interface CommitteeMeeting {
  id: string;
  committee_name: string;
  /** 開催日（YYYY-MM-DD） */
  meeting_date: string;
  title: string;
  summary: string | null;
  key_points: string[];
  agenda_items: string[];
  attendees: string[];
  minutes_text: string | null;
  source_type: CommitteeMeetingSourceType;
  source_note: string | null;
  youtube_url: string | null;
  updated_at: string;
}

/** 一覧表示用（本文テキストを除いた軽量版） */
export type CommitteeMeetingSummary = Omit<CommitteeMeeting, "minutes_text">;
