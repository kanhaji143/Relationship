#!/usr/bin/env node
/**
 * Reproducible evidence run.
 *
 * Runs the quality gates, captures every log under evidence/<run>/, performs
 * route smoke tests against a production server, and runs static policy checks.
 * Never fakes a result: exit codes and assertion output are recorded verbatim.
 *
 * Usage: node scripts/run-evidence.mjs --out evidence/phase0-2026-10-27
 */

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const PORT = 3210;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function parseArgs() {
  const args = process.argv.slice(2);
  const index = args.indexOf("--out");
  const name = index >= 0 && args[index + 1] ? args[index + 1] : "evidence/latest";
  return { name };
}

const outName = parseArgs().name;
const outDir = resolve(root, outName);
mkdirSync(outDir, { recursive: true });

const startedAt = new Date();
const results = [];

function logFile(name, content) {
  writeFileSync(resolve(outDir, name), content, "utf8");
}

function toText(chunk) {
  return chunk.toString("utf8");
}

function runCommand(id, title, command, timeoutMs = 15 * 60 * 1000) {
  return new Promise((resolvePromise) => {
    const started = Date.now();
    const child = spawn(command, {
      cwd: root,
      shell: true,
      env: { ...process.env, CI: "1", FORCE_COLOR: "0" },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += toText(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += toText(chunk);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      const durationMs = Date.now() - started;
      const status = !timedOut && code === 0 ? "PASS" : "FAIL";
      const header = [
        `# ${title}`,
        `command: ${command}`,
        `started: ${new Date(started).toISOString()}`,
        `duration_ms: ${durationMs}`,
        `exit_code: ${code}${timedOut ? " (timed out)" : ""}`,
        `status: ${status}`,
        "",
        "## stdout",
        stdout,
        "## stderr",
        stderr,
      ].join("\n");

      logFile(`${id}.log`, header);
      const record = { id, title, command, status, exitCode: code, durationMs, log: `${id}.log` };
      results.push(record);
      resolvePromise(record);
    });
  });
}

function runStatic(id, title, checks) {
  const lines = [`# ${title}`, ""];
  let status = "PASS";

  for (const check of checks) {
    let passed = false;
    let detail = "";
    try {
      const value = check.run();
      passed = value === true;
      detail = passed ? "ok" : String(value);
    } catch (error) {
      passed = false;
      detail = error instanceof Error ? error.message : String(error);
    }
    if (!passed) status = "FAIL";
    lines.push(
      `[${passed ? "PASS" : "FAIL"}] ${check.name}${detail && !passed ? ` — ${detail}` : ""}`,
    );
  }

  logFile(`${id}.log`, `${lines.join("\n")}\n`);
  results.push({
    id,
    title,
    command: "(static checks)",
    status,
    exitCode: 0,
    durationMs: 0,
    log: `${id}.log`,
  });
}

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/`, { redirect: "manual" });
      if (response.status === 200) return true;
    } catch {
      // server not ready yet
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }
  return false;
}

function killTree(pid) {
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
    } catch {
      // already gone
    }
  } else {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      // already gone
    }
  }
}

async function routeSmoke() {
  const started = Date.now();
  const detailPath = resolve(outDir, "06-route-smoke.json");
  const log = [];
  const checks = [];
  let status = "FAIL";
  let child;

  try {
    child = spawn(`npx next start -p ${PORT}`, {
      cwd: root,
      shell: true,
      env: { ...process.env, CI: "1", FORCE_COLOR: "0" },
      windowsHide: true,
    });
    child.stdout.on("data", (chunk) => log.push(toText(chunk)));
    child.stderr.on("data", (chunk) => log.push(toText(chunk)));

    const ready = await waitForServer();
    if (!ready) throw new Error("server did not become ready within 90s");

    const routes = [
      { path: "/", expectedStatus: 200, expectText: "Relationships with clear intent" },
      { path: "/how-it-works", expectedStatus: 200, expectText: "How it works" },
      { path: "/safety", expectedStatus: 200, expectText: "Safety commitments" },
      { path: "/definitely-not-a-route", expectedStatus: 404, expectText: "Page not found" },
    ];

    for (const route of routes) {
      const response = await fetch(`${BASE_URL}${route.path}`, { redirect: "manual" });
      const body = await response.text();
      const title = /<title>(.*?)<\/title>/s.exec(body)?.[1] ?? "";
      const h1 =
        /<h1[^>]*>(.*?)<\/h1>/s
          .exec(body)?.[1]
          ?.replace(/<[^>]*>/g, "")
          .trim() ?? "";
      const pass = response.status === route.expectedStatus && body.includes(route.expectText);
      checks.push({
        path: route.path,
        expectedStatus: route.expectedStatus,
        actualStatus: response.status,
        expectedText: route.expectText,
        title,
        h1,
        bodyBytes: Buffer.byteLength(body),
        status: pass ? "PASS" : "FAIL",
      });
    }

    status = checks.every((check) => check.status === "PASS") ? "PASS" : "FAIL";
  } catch (error) {
    log.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (child?.pid) killTree(child.pid);
  }

  const durationMs = Date.now() - started;
  logFile("06-route-smoke.log", [`# Route smoke (next start :${PORT})`, "", ...log].join(""));
  logFile(
    detailPath,
    `${JSON.stringify({ baseUrl: BASE_URL, generatedAt: new Date().toISOString(), checks }, null, 2)}\n`,
  );
  results.push({
    id: "06",
    title: "Route smoke",
    command: `next start -p ${PORT} + fetch routes`,
    status,
    exitCode: status === "PASS" ? 0 : 1,
    durationMs,
    log: "06-route-smoke.log",
  });
}

async function main() {
  await runCommand("01", "Format check", "npm run format:check");
  await runCommand("02", "Lint", "npm run lint");
  await runCommand("03", "Typecheck", "npm run typecheck");
  await runCommand("04", "Unit tests", "npm test");
  await runCommand("05", "Production build", "npm run build");

  await routeSmoke();

  await runCommand("07", "Env check", "npm run env:check");

  runStatic("08", "Security rules deny by default", [
    {
      name: "firestore.rules has catch-all deny",
      run: () =>
        /match \/\{document=\*\*\}[\s\S]*?allow read, write: if false/.test(
          read("firestore.rules"),
        ),
    },
    {
      name: "storage.rules has catch-all deny",
      run: () =>
        /match \/\{allPaths=\*\*\}[\s\S]*?allow read, write: if false/.test(read("storage.rules")),
    },
    {
      name: "no permissive allow rule in firestore.rules",
      run: () => !/allow[^;]+if\s+true/.test(read("firestore.rules")),
    },
    {
      name: "no permissive allow rule in storage.rules",
      run: () => !/allow[^;]+if\s+true/.test(read("storage.rules")),
    },
    {
      name: "firebase.json references the rules files",
      run: () => {
        const config = JSON.parse(read("firebase.json"));
        return (
          config.firestore?.rules === "firestore.rules" && config.storage?.rules === "storage.rules"
        );
      },
    },
  ]);

  runStatic("09", "Secret hygiene", [
    {
      name: ".env.local is gitignored",
      run: () => {
        try {
          execFileSync("git", ["check-ignore", "-q", ".env.local"], { cwd: root, stdio: "ignore" });
          return true;
        } catch {
          return false;
        }
      },
    },
    {
      name: "no real env/service-account files are tracked",
      run: () => {
        const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
          .split(/\r?\n/)
          .filter(Boolean);
        const offenders = tracked.filter((file) => {
          if (file === ".env.example") return false;
          return (
            /(^|\/)\.env(\.|$)/.test(file) ||
            /firebase-adminsdk/i.test(file) ||
            /serviceAccountKey/i.test(file)
          );
        });
        return offenders.length === 0 ? true : `tracked: ${offenders.join(", ")}`;
      },
    },
  ]);

  runStatic("10", "Docs and CI parity", [
    {
      name: "required workflow documents exist",
      run: () => {
        const required = [
          "RFP.md",
          "TestCases.md",
          "README.md",
          "docs/SETUP_FIREBASE.md",
          "docs/PHASES.md",
          "docs/DECISIONS.md",
        ];
        const missing = required.filter((file) => !existsSync(resolve(root, file)));
        return missing.length === 0 ? true : `missing: ${missing.join(", ")}`;
      },
    },
    {
      name: "README links resolve to files in the repo",
      run: () => {
        const readme = read("README.md");
        const links = [...readme.matchAll(/\]\(([^)#]+)\)/g)]
          .map((match) => match[1])
          .filter((link) => !/^https?:/.test(link) && !link.startsWith("#"));
        const missing = links.filter((link) => !existsSync(resolve(root, link)));
        return missing.length === 0 ? true : `broken: ${missing.join(", ")}`;
      },
    },
    {
      name: "CI runs the same quality gates",
      run: () => {
        const ci = read(".github/workflows/ci.yml");
        return [
          "npm run format:check",
          "npm run lint",
          "npm run typecheck",
          "npm test",
          "npm run build",
        ].every((command) => ci.includes(command));
      },
    },
  ]);

  runStatic("11", "Accessibility and honest-claim markers", [
    {
      name: "skip link present in root layout",
      run: () => read("app/layout.tsx").includes('href="#main"'),
    },
    {
      name: "visible focus styles defined",
      run: () => read("app/globals.css").includes(":focus-visible"),
    },
    {
      name: "reduced-motion support defined",
      run: () => read("app/globals.css").includes("prefers-reduced-motion"),
    },
    {
      name: "provisional brand label rendered",
      run: () => read("components/layout/SiteHeader.tsx").includes("working name"),
    },
    {
      name: "no positive end-to-end-encryption claim in UI copy",
      run: () => {
        const pages = [
          "app/page.tsx",
          "app/(marketing)/how-it-works/page.tsx",
          "app/(marketing)/safety/page.tsx",
        ];
        // A denial ("no E2EE claim") is allowed; a positive claim is not.
        return pages.every(
          (page) => !/end-to-end encrypted|provides? end-to-end encryption/i.test(read(page)),
        );
      },
    },
  ]);

  runStatic("12", "Firebase wiring", [
    {
      name: "emulator ports configured (auth 9099, firestore 8080, storage 9199, ui 4000)",
      run: () => {
        const config = JSON.parse(read("firebase.json"));
        const emulators = config.emulators ?? {};
        return (
          emulators.auth?.port === 9099 &&
          emulators.firestore?.port === 8080 &&
          emulators.storage?.port === 9199 &&
          emulators.ui?.port === 4000
        );
      },
    },
    {
      name: "client SDK wires auth + firestore emulators behind the env flag",
      run: () => {
        const client = read("lib/firebase/client/app.ts");
        return (
          client.includes("connectAuthEmulator") &&
          client.includes("connectFirestoreEmulator") &&
          client.includes("NEXT_PUBLIC_USE_FIREBASE_EMULATOR")
        );
      },
    },
    {
      name: "admin SDK is server-only and supports ADC + service account",
      run: () => {
        const admin = read("lib/firebase/admin/app.ts");
        return (
          admin.includes('import "server-only"') &&
          admin.includes("applicationDefault") &&
          admin.includes("cert(")
        );
      },
    },
    {
      name: "no Firebase API key hard-coded in source",
      run: () => {
        const client = read("lib/firebase/client/app.ts");
        return !/AIza[0-9A-Za-z_-]{20,}/.test(client);
      },
    },
  ]);

  const finishedAt = new Date();
  const summary = {
    run: outName,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt - startedAt,
    environment: {
      node: process.version,
      npm:
        process.env.npm_config_user_agent?.match(/npm\/([\d.]+)/)?.[1] ?? "unknown (run via npm)",
      platform: process.platform,
      arch: process.arch,
      next: JSON.parse(read("package.json")).dependencies.next,
      gitCommit: execFileSync("git", ["rev-parse", "--short", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
      gitBranch: execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
    },
    totals: {
      total: results.length,
      passed: results.filter((result) => result.status === "PASS").length,
      failed: results.filter((result) => result.status === "FAIL").length,
    },
    results: results.map(({ log, ...rest }) => ({ ...rest, log })),
  };

  logFile("summary.json", `${JSON.stringify(summary, null, 2)}\n`);

  const table = results
    .map(
      (result) =>
        `| ${result.id} | ${result.title} | ${result.status === "PASS" ? "✅ PASS" : "❌ FAIL"} | ${result.durationMs} ms | \`${result.log}\` |`,
    )
    .join("\n");

  const summaryMd = `# Evidence summary — ${outName}

- Started: ${summary.startedAt}
- Finished: ${summary.finishedAt}
- Duration: ${(summary.durationMs / 1000).toFixed(1)} s
- Node: ${summary.environment.node} · npm: ${summary.environment.npm} · Next: ${summary.environment.next}
- Git: ${summary.environment.gitBranch}@${summary.environment.gitCommit}

## Results

| # | Check | Status | Duration | Log |
|---|---|---|---|---|
${table}

**Total: ${summary.totals.passed}/${summary.totals.total} passed, ${summary.totals.failed} failed.**
`;

  logFile("summary.md", summaryMd);
  console.log(summaryMd);
  if (summary.totals.failed > 0) process.exitCode = 1;
}

await main();
