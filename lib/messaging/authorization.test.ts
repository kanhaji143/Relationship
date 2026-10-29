import { describe, expect, it } from "vitest";

import {
  canReadConversation,
  canSendMessage,
  isParticipant,
  otherParticipantUid,
  type ConversationState,
} from "./authorization";

const state: ConversationState = {
  participantUids: ["alice", "bob"],
  conversationStatus: "active",
  matchStatus: "active",
};

describe("conversation authorization", () => {
  it("lets both participants read the thread", () => {
    expect(canReadConversation("alice", state)).toEqual({ allowed: true });
    expect(canReadConversation("bob", state)).toEqual({ allowed: true });
  });

  it("hides the thread from non-participants and missing users", () => {
    expect(canReadConversation("carol", state)).toEqual({
      allowed: false,
      reason: "not_participant",
    });
    expect(canReadConversation("", state)).toEqual({ allowed: false, reason: "not_participant" });
  });

  it("allows sending in an active, unblocked conversation", () => {
    expect(canSendMessage("alice", state, false)).toEqual({ allowed: true });
  });

  it("blocks sending after a block in either direction", () => {
    expect(canSendMessage("alice", state, true)).toEqual({ allowed: false, reason: "blocked" });
  });

  it("rejects sending after unmatch or when the conversation is closed", () => {
    expect(canSendMessage("alice", { ...state, matchStatus: "unmatched" }, false)).toEqual({
      allowed: false,
      reason: "match_inactive",
    });
    expect(canSendMessage("alice", { ...state, conversationStatus: "closed" }, false)).toEqual({
      allowed: false,
      reason: "conversation_closed",
    });
  });

  it("rejects sending by non-participants before other checks", () => {
    expect(canSendMessage("carol", state, true)).toEqual({
      allowed: false,
      reason: "not_participant",
    });
  });
});

describe("participant helpers", () => {
  it("detects participants", () => {
    expect(isParticipant("alice", ["alice", "bob"])).toBe(true);
    expect(isParticipant("carol", ["alice", "bob"])).toBe(false);
  });

  it("resolves the other participant", () => {
    expect(otherParticipantUid("alice", ["alice", "bob"])).toBe("bob");
    expect(otherParticipantUid("bob", ["alice", "bob"])).toBe("alice");
    expect(otherParticipantUid("carol", ["alice", "bob"])).toBe("alice");
    expect(otherParticipantUid("alice", ["alice"])).toBeNull();
  });
});
