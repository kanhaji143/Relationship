<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## Project workflow (saved rule — applies to every task)

1. **Root organization** — all project files live under the repo root (`D:\Relationship Apps`); new artifacts follow the existing folder structure. Do not scatter files outside it.
2. **Requirements first** — requirements are captured in `RFP.md`. The owner writes their own requirements in the marked **input space** (§1). Never delete or overwrite that space.
3. **Test cases second** — `TestCases.md` is generated/updated from the requirements in `RFP.md`. Every test case has: ID, mapped requirement, preconditions, numbered steps, expected outcome, validation points, actual result, status.
4. **Execute honestly** — run every test case. Do not mark a case passed unless its command/output is captured. If a prerequisite is missing (for example no Firebase project), mark it blocked with the reason instead of faking a pass.
5. **Evidence** — every run writes logs/output/verification proof under `evidence/<run-name>/`, plus a run summary (`summary.md`/`summary.json`). Evidence is committed with the change.
6. **Finish** — update `TestCases.md` actual results, update `RFP.md` traceability, update `docs/PHASES.md` if a phase milestone moved, then commit.

If the owner's requirement input space is empty, use the current approved baseline (`RFP.md` §2) as the requirement source and state that assumption explicitly.

Reproducible evidence run: `npm run evidence` (see `scripts/run-evidence.mjs`).
