import "server-only";

import { promptLabel, type ProfilePromptKey } from "@/lib/config/prompts";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getAdminDb } from "@/lib/firebase/admin/app";
import type { PromptAnswerDTO } from "@/features/prompts/types";

/** Owner-only read; query is always scoped to the authenticated uid. */
export async function getPromptAnswers(uid: string): Promise<PromptAnswerDTO[]> {
  const snapshot = await getAdminDb().collection(COLLECTIONS.prompts).where("uid", "==", uid).get();

  return snapshot.docs
    .map((document) => {
      const data = document.data();
      if (typeof data.promptKey !== "string" || typeof data.responseText !== "string") return null;
      return {
        promptKey: data.promptKey as ProfilePromptKey,
        promptText: promptLabel(data.promptKey),
        responseText: data.responseText,
      };
    })
    .filter((answer): answer is PromptAnswerDTO => answer !== null);
}
