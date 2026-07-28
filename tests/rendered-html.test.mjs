import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the TypeBloom experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type")?.startsWith("text/html"), true);

  const html = await response.text();
  assert.match(html, /<title>TypeBloom/);
  assert.match(html, /Find your/);
  assert.match(html, /Choose your level/);
  assert.match(html, /Set the clock/);
  assert.match(html, /Start typing/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/);
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
    new URL("../app/page.tsx", import.meta.url),
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
});
