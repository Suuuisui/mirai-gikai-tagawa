import { describe, expect, it } from "vitest";
import { isCommitteeMeetingId } from "./committee-meeting-id";

describe("isCommitteeMeetingId", () => {
  it("UUID はIDとして扱う（大文字でも）", () => {
    expect(isCommitteeMeetingId("8bc3dc16-1490-4efd-b1fe-8434c62e6acf")).toBe(
      true
    );
    expect(isCommitteeMeetingId("8BC3DC16-1490-4EFD-B1FE-8434C62E6ACF")).toBe(
      true
    );
  });

  it("UUID でない値はIDとして扱わない", () => {
    expect(isCommitteeMeetingId("foo")).toBe(false);
    expect(isCommitteeMeetingId("group")).toBe(false);
    expect(isCommitteeMeetingId("")).toBe(false);
    // 桁が足りない・前後に余分な文字がある
    expect(isCommitteeMeetingId("8bc3dc16-1490-4efd-b1fe-8434c62e6ac")).toBe(
      false
    );
    expect(isCommitteeMeetingId("8bc3dc16-1490-4efd-b1fe-8434c62e6acf/")).toBe(
      false
    );
    expect(isCommitteeMeetingId(" 8bc3dc16-1490-4efd-b1fe-8434c62e6acf")).toBe(
      false
    );
  });
});
