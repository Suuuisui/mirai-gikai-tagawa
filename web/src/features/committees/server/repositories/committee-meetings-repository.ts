import "server-only";
import { createAdminClient } from "@mirai-gikai/supabase";
import type {
  CommitteeMeeting,
  CommitteeMeetingListItem,
  CommitteeMeetingSummary,
} from "../../shared/types";
import { toStringArray } from "../../shared/utils/committee-meeting-parser";

type CommitteeMeetingRow = {
  id: string;
  committee_name: string;
  meeting_date: string;
  title: string;
  headline: string | null;
  topics: unknown;
  summary: string | null;
  key_points: unknown;
  agenda_items: unknown;
  attendees: unknown;
  minutes_text?: string | null;
  source_type: string;
  source_note: string | null;
  youtube_url: string | null;
  updated_at: string;
};

function toMeeting(row: CommitteeMeetingRow): CommitteeMeeting {
  return {
    id: row.id,
    committee_name: row.committee_name,
    meeting_date: row.meeting_date,
    title: row.title,
    headline: row.headline,
    topics: toStringArray(row.topics),
    summary: row.summary,
    key_points: toStringArray(row.key_points),
    agenda_items: toStringArray(row.agenda_items),
    attendees: toStringArray(row.attendees),
    minutes_text: row.minutes_text ?? null,
    source_type: row.source_type === "youtube" ? "youtube" : "disclosure",
    source_note: row.source_note,
    youtube_url: row.youtube_url,
    updated_at: row.updated_at,
  };
}

const SUMMARY_COLUMNS =
  "id, committee_name, meeting_date, title, headline, topics, summary, key_points, agenda_items, attendees, source_type, source_note, youtube_url, updated_at";

/** 全会議録を開催日の降順で取得（一覧用・本文なし） */
export async function findAllCommitteeMeetings(): Promise<
  CommitteeMeetingSummary[]
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("committee_meetings")
    .select(SUMMARY_COLUMNS)
    .order("meeting_date", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch committee meetings: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const { minutes_text: _unused, ...summary } = toMeeting(
      row as CommitteeMeetingRow
    );
    return summary;
  });
}

const LIST_COLUMNS =
  "id, committee_name, meeting_date, headline, topics, source_type";

/**
 * 一覧の行・前後ナビ・出典リンク解決に必要な項目だけを開催日の降順で取得。
 * 要約や要点を含めないので、全件でも数十KBに収まる
 */
export async function findAllCommitteeMeetingListItems(): Promise<
  CommitteeMeetingListItem[]
> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("committee_meetings")
    .select(LIST_COLUMNS)
    .order("meeting_date", { ascending: false });

  if (error) {
    throw new Error(
      `Failed to fetch committee meeting list items: ${error.message}`
    );
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    committee_name: row.committee_name,
    meeting_date: row.meeting_date,
    headline: row.headline,
    topics: toStringArray(row.topics),
    source_type: row.source_type === "youtube" ? "youtube" : "disclosure",
  }));
}

/** IDで会議録を1件取得（本文あり） */
export async function findCommitteeMeetingById(
  id: string
): Promise<CommitteeMeeting | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("committee_meetings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch committee meeting: ${error.message}`);
  }

  return data ? toMeeting(data as CommitteeMeetingRow) : null;
}
