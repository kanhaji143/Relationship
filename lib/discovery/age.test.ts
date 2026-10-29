import { describe, expect, it } from "vitest";

import { ageFromBirthDate } from "./age";

describe("ageFromBirthDate", () => {
  it("calculates age using UTC calendar dates", () => {
    expect(ageFromBirthDate("2000-10-29", new Date("2026-10-29T00:00:00.000Z"))).toBe(26);
    expect(ageFromBirthDate("2000-10-30", new Date("2026-10-29T23:59:00.000Z"))).toBe(25);
  });

  it("rejects missing or impossible dates", () => {
    expect(ageFromBirthDate(null, new Date("2026-10-29T00:00:00.000Z"))).toBeNull();
    expect(ageFromBirthDate("1990-02-30", new Date("2026-10-29T00:00:00.000Z"))).toBeNull();
  });
});
