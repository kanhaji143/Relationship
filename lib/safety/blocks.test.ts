import { describe, expect, it } from "vitest";

import { blockDocumentId } from "./blocks";

describe("blockDocumentId", () => {
  it("is stable for the same ordered pair, so repeats are idempotent", () => {
    expect(blockDocumentId("alice", "bob")).toBe(blockDocumentId("alice", "bob"));
  });

  it("is directional: A blocking B is not B blocking A", () => {
    expect(blockDocumentId("alice", "bob")).not.toBe(blockDocumentId("bob", "alice"));
  });

  it("produces a fixed-length hex id without exposing the uids", () => {
    const id = blockDocumentId("alice", "bob");
    expect(id).toMatch(/^[a-f0-9]{64}$/);
    expect(id).not.toContain("alice");
    expect(id).not.toContain("bob");
  });
});
