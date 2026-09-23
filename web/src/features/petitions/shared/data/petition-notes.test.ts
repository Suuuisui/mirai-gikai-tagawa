import { describe, expect, it } from "vitest";
import { findPetitionNote, PETITION_NOTES } from "./petition-notes";
import { PETITIONS } from "./petitions-data";

const PETITION_BY_ID = new Map(PETITIONS.map((p) => [p.id, p]));

describe("PETITION_NOTES", () => {
  const petitionIds = new Set(PETITIONS.map((p) => p.id));

  it("id は請願・陳情の記録に存在し、重複しない", () => {
    const ids = PETITION_NOTES.map((note) => note.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(petitionIds.has(id), id).toBe(true);
    }
  });

  it("内容・理由・意見・審査結果のいずれかがあり、長さが表示に収まる", () => {
    for (const note of PETITION_NOTES) {
      expect(
        Boolean(
          note.gist ||
            note.reasons?.length ||
            note.councilOpinion ||
            note.decision
        ),
        note.id
      ).toBe(true);
      if (note.decision) {
        expect(note.decision.minutesDate, note.id).toMatch(
          /^\d{4}-\d{2}-\d{2}$/
        );
        if (note.decision.report) {
          expect(note.decision.report.length, note.id).toBeLessThanOrEqual(400);
        }
      }
      if (note.gist) expect(note.gist.length, note.id).toBeLessThanOrEqual(160);
      for (const reason of note.reasons ?? []) {
        expect(reason.length, `${note.id}: ${reason}`).toBeLessThanOrEqual(90);
      }
      expect((note.reasons ?? []).length, note.id).toBeLessThanOrEqual(5);
    }
  });

  it("審査の結果は、結果が出た請願・陳情にだけ付き、日付が公式の議決日と一致する", () => {
    for (const note of PETITION_NOTES) {
      if (!note.decision) continue;
      const petition = PETITION_BY_ID.get(note.id);
      expect(petition?.decidedDate, note.id).toBe(note.decision.minutesDate);
    }
  });

  it("findPetitionNote は無い id に undefined を返す", () => {
    expect(findPetitionNote("no-such-id")).toBeUndefined();
  });
});
