import { describe, expect, it } from "vitest";

import { likeDocumentId } from "./like-id";

describe("likeDocumentId", () => {
  it("is deterministic for one direction", () => {
    expect(likeDocumentId("user-a", "user-b")).toBe(likeDocumentId("user-a", "user-b"));
  });

  it("distinguishes opposite directions and does not expose UIDs", () => {
    const forward = likeDocumentId("user-a", "user-b");
    const reverse = likeDocumentId("user-b", "user-a");

    expect(forward).not.toBe(reverse);
    expect(forward).not.toContain("user-a");
    expect(forward).not.toContain("user-b");
    expect(forward).toMatch(/^[a-f0-9]{64}$/);
  });
});
