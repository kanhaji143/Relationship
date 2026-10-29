import { describe, expect, it } from "vitest";

import { blockTargetSchema, reportSchema, sendMessageSchema } from "./messaging";

describe("sendMessageSchema", () => {
  it("accepts a trimmed text message", () => {
    const result = sendMessageSchema.safeParse({ text: "  Hello there  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.text).toBe("Hello there");
  });

  it("accepts newlines and up to 1000 characters", () => {
    expect(sendMessageSchema.safeParse({ text: "Hi\nthere" }).success).toBe(true);
    expect(sendMessageSchema.safeParse({ text: "a".repeat(1000) }).success).toBe(true);
  });

  it("rejects empty, whitespace-only and oversized messages", () => {
    expect(sendMessageSchema.safeParse({ text: "" }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ text: "   " }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ text: "a".repeat(1001) }).success).toBe(false);
  });

  it("rejects control characters and unknown fields", () => {
    expect(sendMessageSchema.safeParse({ text: "hello\u0000" }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ text: "hello", senderUid: "someone" }).success).toBe(
      false,
    );
  });
});

describe("blockTargetSchema", () => {
  it("requires a bounded target uid", () => {
    expect(blockTargetSchema.safeParse({ targetUid: "abc" }).success).toBe(true);
    expect(blockTargetSchema.safeParse({ targetUid: "" }).success).toBe(false);
    expect(blockTargetSchema.safeParse({ targetUid: "a".repeat(129) }).success).toBe(false);
    expect(blockTargetSchema.safeParse({ targetUid: "abc", note: "x" }).success).toBe(false);
  });
});

describe("reportSchema", () => {
  it("accepts a known category with a target", () => {
    expect(reportSchema.safeParse({ targetUid: "abc", category: "spam" }).success).toBe(true);
    expect(reportSchema.safeParse({ conversationId: "conv", category: "harassment" }).success).toBe(
      true,
    );
  });

  it("rejects unknown categories and reports without a target", () => {
    expect(reportSchema.safeParse({ targetUid: "abc", category: "rude" }).success).toBe(false);
    expect(reportSchema.safeParse({ category: "spam" }).success).toBe(false);
  });
});
