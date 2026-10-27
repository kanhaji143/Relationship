import { describe, expect, it } from "vitest";

import { canonicalMatchId, messageDoc, userPrivateDoc } from "./collections";

describe("canonicalMatchId", () => {
  it("is independent of argument order", () => {
    expect(canonicalMatchId("zeta", "alpha")).toBe("alpha_zeta");
    expect(canonicalMatchId("alpha", "zeta")).toBe("alpha_zeta");
  });

  it("produces one id per pair", () => {
    expect(canonicalMatchId("u2", "u1")).toBe(canonicalMatchId("u1", "u2"));
  });
});

describe("document paths", () => {
  it("keeps private data in a subcollection", () => {
    expect(userPrivateDoc("u1", "ageAssurance")).toBe("users/u1/private/ageAssurance");
  });

  it("scopes messages under a conversation", () => {
    expect(messageDoc("m1", "msg1")).toBe("conversations/m1/messages/msg1");
  });
});
