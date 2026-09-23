import { describe, expect, it } from "vitest";
import { findPetitionNote, PETITION_NOTES } from "./petition-notes";
import { PETITIONS } from "./petitions-data";

describe("PETITION_NOTES", () => {
  const petitionIds = new Set(PETITIONS.map((p) => p.id));

  it("id は請願・陳情の記録に存在し、重複しない", () => {
    const ids = PETITION_NOTES.map((note) => note.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(petitionIds.has(id), id).toBe(true);
    }
  });

  it("内容・理由・意見のいずれかがあり、長さが表示に収まる", () => {
    for (const note of PETITION_NOTES) {
      expect(
        Boolean(note.gist || note.reasons?.length || note.councilOpinion),
        note.id
      ).toBe(true);
      if (note.gist) expect(note.gist.length, note.id).toBeLessThanOrEqual(160);
      for (const reason of note.reasons ?? []) {
        expect(reason.length, `${note.id}: ${reason}`).toBeLessThanOrEqual(90);
      }
      expect((note.reasons ?? []).length, note.id).toBeLessThanOrEqual(5);
    }
  });

  it("findPetitionNote は無い id に undefined を返す", () => {
    expect(findPetitionNote("no-such-id")).toBeUndefined();
  });
});
