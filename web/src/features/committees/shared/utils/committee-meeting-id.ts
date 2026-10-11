const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 会議のID（committee_meetings.id、UUID）の形をしているか */
export function isCommitteeMeetingId(value: string): boolean {
  return UUID_PATTERN.test(value);
}
