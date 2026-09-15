import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  calculatePerformance,
  charactersMatch,
  createWeakKeyPassage,
  getWeakKeys,
  readStoredHistory,
} from "../app/typing-analytics.ts";

test("protects the typing studio with verified Google authentication", async () => {
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
  const loginButton = await readFile(
    new URL("../app/login/google-sign-in-button.tsx", import.meta.url),
    "utf8",
  );
  const proxy = await readFile(
    new URL("../proxy.ts", import.meta.url),
    "utf8",
  );
  const packageJson = await readFile(
    new URL("../package.json", import.meta.url),
    "utf8",
  );

  assert.match(auth, /Google/);
  assert.match(auth, /email_verified === true/);
  assert.match(auth, /strategy: "jwt"/);
  assert.match(home, /redirect\("\/login"\)/);
  assert.match(login, /Welcome/);
  assert.match(login, /Sign in to continue/);
  assert.match(login, /signIn\("google"/);
  assert.match(loginButton, /Continue with Google/);
  assert.match(loginButton, /useFormStatus/);
  assert.match(proxy, /api\/auth\|login/);
  assert.match(packageJson, /next-auth/);
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

test("uses keyboard-typeable sample characters and reserves symbols for hard mode", async () => {
  const samples = await readFile(
    new URL("../app/samples.ts", import.meta.url),
    "utf8",
  );
  const easyAndMedium = samples.slice(
    samples.indexOf("const easy"),
    samples.indexOf("const hard"),
  );
  const hard = samples.slice(
    samples.indexOf("const hard"),
    samples.indexOf("export const sampleBank"),
  );

  assert.doesNotMatch(samples, /[^\x00-\x7F]/);
  assert.doesNotMatch(easyAndMedium, /[!@#$%^&+<>/_]/);
  assert.match(hard, /[!@#$%+<>/_]/);
});

test("treats smart punctuation as its keyboard equivalent", async () => {
  const analytics = await readFile(
    new URL("../app/typing-analytics.ts", import.meta.url),
    "utf8",
  );

  assert.match(analytics, /const keyboardEquivalent/);
  assert.match(analytics, /export function charactersMatch/);
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
    /startedAtRef\.current === null && next\.length > 0/,
  );
  assert.match(page, /Starts on first key/);
  assert.match(
    page,
    /onClick=\{\(\) => window\.location\.reload\(\)\}/,
  );
});

test("provides live statistics and a complete results dashboard", async () => {
  const page = await readFile(
    new URL("../app/typing-practice.tsx", import.meta.url),
    "utf8",
  );
  const results = await readFile(
    new URL("../app/results-dashboard.tsx", import.meta.url),
    "utf8",
  );

  for (const label of ["Live pace", "Accuracy", "Correct", "Errors", "Time left"]) {
    assert.match(page, new RegExp(label));
  }
  for (const label of [
    "Final speed",
    "Total typed",
    "Incorrect",
    "Total errors",
    "Time taken",
    "Personal best",
    "Try Again",
    "Practice Weak Keys",
  ]) {
    assert.match(results, new RegExp(label));
  }
});

test("stores ten results locally and generates weak-key practice", async () => {
  const page = await readFile(
    new URL("../app/typing-practice.tsx", import.meta.url),
    "utf8",
  );
  const analytics = await readFile(
    new URL("../app/typing-analytics.ts", import.meta.url),
    "utf8",
  );
  const chart = await readFile(
    new URL("../app/progress-chart.tsx", import.meta.url),
    "utf8",
  );

  assert.match(analytics, /MAX_HISTORY_ITEMS = 10/);
  assert.match(analytics, /createWeakKeyPassage/);
  assert.match(analytics, /aggregateMistakes/);
  assert.match(page, /window\.localStorage\.setItem\(HISTORY_STORAGE_KEY/);
  assert.match(page, /window\.localStorage\.setItem\(PERSONAL_BEST_STORAGE_KEY/);
  assert.match(page, /startWeakKeyPractice/);
  assert.match(chart, /<svg/);
  assert.doesNotMatch(chart, /chart\.js|recharts|d3/i);
});

test("calculates live WPM, accuracy, and incorrect characters", () => {
  assert.deepEqual(calculatePerformance("hello", "hello", 60), {
    correct: 5,
    errors: 0,
    correctWords: 1,
    incorrectWords: 0,
    wpm: 1,
    accuracy: 100,
    characters: 5,
  });
  assert.deepEqual(calculatePerformance("hezlo", "hello", 30), {
    correct: 4,
    errors: 1,
    correctWords: 0,
    incorrectWords: 1,
    wpm: 0,
    accuracy: 80,
    characters: 5,
  });
  assert.equal(
    calculatePerformance(`Z${"a".repeat(999)}`, `A${"a".repeat(999)}`, 60)
      .accuracy,
    99.9,
  );
  assert.equal(charactersMatch('"', "“"), true);
  assert.equal(charactersMatch("-", "—"), true);
});

test("counts characters independently while requiring a fully correct word", () => {
  assert.deepEqual(calculatePerformance("markering", "marketing", 60), {
    correct: 8,
    errors: 1,
    correctWords: 0,
    incorrectWords: 1,
    wpm: 0,
    accuracy: 88.9,
    characters: 9,
  });

  const severalMistakes = calculatePerformance("mxrkxting", "marketing", 60);
  assert.equal(severalMistakes.correctWords, 0);
  assert.equal(severalMistakes.incorrectWords, 1);
  assert.equal(severalMistakes.correct, 7);
  assert.equal(severalMistakes.errors, 2);

  const mixed = calculatePerformance(
    "digital markering grows businesses",
    "digital marketing grows businesses",
    60,
  );
  assert.equal(mixed.correctWords, 3);
  assert.equal(mixed.incorrectWords, 1);
  assert.equal(mixed.correct, 33);
  assert.equal(mixed.errors, 1);
  assert.equal(mixed.accuracy, 97.1);
});

test("renders one non-wrapping typing track that advances with progress", async () => {
  const page = await readFile(
    new URL("../app/typing-practice.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(page, /className="passage-track"/);
  assert.match(page, /translate3d/);
  assert.match(styles, /\.passage[\s\S]*?overflow:\s*hidden;/);
  assert.match(styles, /\.passage[\s\S]*?white-space:\s*nowrap;/);
});

test("ranks weak keys and creates a focused realistic passage", () => {
  assert.deepEqual(
    getWeakKeys({ R: 6, T: 4, P: 3, A: 1 }, 3),
    [
      { key: "R", mistakes: 6 },
      { key: "T", mistakes: 4 },
      { key: "P", mistakes: 3 },
    ],
  );
  const passage = createWeakKeyPassage(["Z"]);
  const words = passage.toLowerCase().match(/[a-z]+/g) ?? [];
  assert.equal(words.length, 48);
  assert.equal(words.every((word) => word.includes("z")), true);
});

test("validates stored history and retains only the latest ten tests", () => {
  const records = Array.from({ length: 12 }, (_, index) => ({
    id: String(index),
    completedAt: new Date(2026, 0, index + 1).toISOString(),
    wpm: 30 + index,
    accuracy: 95,
    totalCharacters: 100,
    correctCharacters: 95,
    incorrectCharacters: 5,
    totalErrors: 6,
    timeTakenSeconds: 60,
    difficulty: "easy",
    durationMinutes: 1,
    mode: "standard",
    mistakeCounts: { R: 2 },
  }));
  const history = readStoredHistory(JSON.stringify(records));

  assert.equal(history.length, 10);
  assert.equal(history[0].id, "2");
  assert.equal(history[9].id, "11");
  assert.equal(history[9].correctWords, 19);
  assert.equal(history[9].incorrectWords, 0);
  assert.deepEqual(readStoredHistory("not-json"), []);
});
