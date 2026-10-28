import { describe, expect, it } from "vitest";

import { promptAnswersSchema } from "./prompts";

const response = "Long walks, good coffee and trying a new recipe together.";

describe("promptAnswersSchema", () => {
  it("accepts up to three approved answers", () => {
    expect(
      promptAnswersSchema.safeParse({
        answers: [
          { promptKey: "small_joy", responseText: response },
          {
            promptKey: "curiosity",
            responseText: "I would love to learn pottery and make a small bowl.",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("allows clearing all answers", () => {
    expect(promptAnswersSchema.safeParse({ answers: [] }).success).toBe(true);
  });

  it("rejects unknown and duplicate prompt keys", () => {
    expect(
      promptAnswersSchema.safeParse({ answers: [{ promptKey: "custom", responseText: response }] })
        .success,
    ).toBe(false);
    expect(
      promptAnswersSchema.safeParse({
        answers: [
          { promptKey: "small_joy", responseText: response },
          { promptKey: "small_joy", responseText: "I enjoy learning new things every week." },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects too many, short, long and unsafe answers", () => {
    expect(
      promptAnswersSchema.safeParse({
        answers: [
          { promptKey: "small_joy", responseText: response },
          { promptKey: "curiosity", responseText: response },
          { promptKey: "ideal_weekend", responseText: response },
          { promptKey: "conversation", responseText: response },
        ],
      }).success,
    ).toBe(false);
    expect(
      promptAnswersSchema.safeParse({
        answers: [{ promptKey: "small_joy", responseText: "Short." }],
      }).success,
    ).toBe(false);
    expect(
      promptAnswersSchema.safeParse({
        answers: [{ promptKey: "small_joy", responseText: "A".repeat(241) }],
      }).success,
    ).toBe(false);
    expect(
      promptAnswersSchema.safeParse({
        answers: [{ promptKey: "small_joy", responseText: "Please email me at user@example.com" }],
      }).success,
    ).toBe(false);
    expect(
      promptAnswersSchema.safeParse({
        answers: [{ promptKey: "small_joy", responseText: "Call me at 1234567890 for details." }],
      }).success,
    ).toBe(false);
  });
});
