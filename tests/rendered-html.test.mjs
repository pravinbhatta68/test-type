import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("protects the typing studio with verified Gmail authentication", async () => {
  const auth = await readFile(
    new URL("../auth.ts", import.meta.url),
    "utf8",
  );
  const home = await readFile(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const login = await readFile(
    new URL("../app/login/page.tsx", import.meta.url),
    "utf8",
  );
  const route = await readFile(
    new URL("../app/api/auth/[...nextauth]/route.ts", import.meta.url),
    "utf8",
  );

  assert.match(auth, /email_verified === true/);
  assert.match(auth, /@gmail\.com/);
  assert.match(auth, /@googlemail\.com/);
  assert.match(home, /redirect\("\/login"\)/);
  assert.match(login, /Continue with Gmail/);
  assert.match(login, /signIn\("google"/);
  assert.match(route, /export const \{ GET, POST \} = handlers/);
});

test("ships exactly 100 practice samples across all levels", async () => {
  const samples = await readFile(
    new URL("../app/samples.ts", import.meta.url),
    "utf8",
  );
  const sampleLines = samples.match(/^  "/gm) ?? [];
  assert.equal(sampleLines.length, 100);
  assert.match(samples, /difficulty: "easy"/);
  assert.match(samples, /difficulty: "medium"/);
  assert.match(samples, /difficulty: "hard"/);
});

test("waits for the first character before starting the timer", async () => {
  const page = await readFile(
    new URL("../app/typing-practice.tsx", import.meta.url),
    "utf8",
  );
  assert.match(
    page,
    /setPhase\("running"\);\s*setStartedAt\(null\);/,
  );
  assert.match(
    page,
    /startedAt === null && next\.length > 0[\s\S]*setStartedAt\(Date\.now\(\)\)/,
  );
  assert.match(page, /Starts on first key/);
  assert.match(
    page,
    /onClick=\{\(\) => window\.location\.reload\(\)\}/,
  );
});
