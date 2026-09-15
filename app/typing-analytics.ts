import type { Difficulty } from "./samples";

export type WeakKey = {
  key: string;
  mistakes: number;
};

export type TestMode = "standard" | "weak-keys";

export type TestRecord = {
  id: string;
  completedAt: string;
  wpm: number;
  accuracy: number;
  totalCharacters: number;
  correctCharacters: number;
  incorrectCharacters: number;
  correctWords: number;
  incorrectWords: number;
  totalErrors: number;
  timeTakenSeconds: number;
  difficulty: Difficulty;
  durationMinutes: number;
  mode: TestMode;
  mistakeCounts: Record<string, number>;
};

export const HISTORY_STORAGE_KEY = "typebloom.recent-tests.v1";
export const PERSONAL_BEST_STORAGE_KEY = "typebloom.personal-best.v1";
export const MAX_HISTORY_ITEMS = 10;

const keyboardEquivalent: Record<string, string> = {
  "“": '"',
  "”": '"',
  "‘": "'",
  "’": "'",
  "–": "-",
  "—": "-",
};

export function charactersMatch(
  typedCharacter: string,
  sampleCharacter: string,
) {
  return (
    (keyboardEquivalent[typedCharacter] ?? typedCharacter) ===
    (keyboardEquivalent[sampleCharacter] ?? sampleCharacter)
  );
}

export function calculatePerformance(
  typed: string,
  passage: string,
  elapsedSeconds: number,
) {
  let correct = 0;
  for (let index = 0; index < typed.length; index += 1) {
    if (charactersMatch(typed[index], passage[index])) correct += 1;
  }

  const words = Array.from(passage.matchAll(/\S+/g));
  let correctWords = 0;
  let incorrectWords = 0;

  for (const match of words) {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;

    // A word is attempted as soon as its first position is typed. It only
    // becomes correct after every character in that target word matches.
    if (typed.length <= start) break;

    const isComplete = typed.length >= end;
    const isCorrect =
      isComplete &&
      word.split("").every((character, wordIndex) =>
        charactersMatch(typed[start + wordIndex], character),
      );

    if (isCorrect) correctWords += 1;
    else incorrectWords += 1;
  }

  const safeElapsed = Math.max(1, elapsedSeconds);

  return {
    correct,
    errors: typed.length - correct,
    correctWords,
    incorrectWords,
    wpm: Math.round(correctWords / (safeElapsed / 60)),
    accuracy: typed.length
      ? Math.round((correct / typed.length) * 1000) / 10
      : 100,
    characters: typed.length,
  };
}

const weakKeyWords = [
  "accuracy",
  "adjust",
  "balance",
  "because",
  "bright",
  "browser",
  "careful",
  "challenge",
  "character",
  "comfortable",
  "develop",
  "different",
  "discover",
  "efficient",
  "example",
  "exercise",
  "flexible",
  "focus",
  "frequent",
  "growth",
  "improve",
  "journey",
  "keyboard",
  "knowledge",
  "language",
  "measure",
  "movement",
  "number",
  "organize",
  "paragraph",
  "practice",
  "precision",
  "progress",
  "quality",
  "quickly",
  "quiet",
  "repeat",
  "result",
  "rhythm",
  "sentence",
  "smooth",
  "steady",
  "technique",
  "thoughtful",
  "typing",
  "unique",
  "useful",
  "valuable",
  "window",
  "workshop",
  "xylophone",
  "yellow",
  "yourself",
  "zealous",
  "zigzag",
] as const;

export function getWeakKeys(
  mistakeCounts: Record<string, number>,
  limit = 5,
): WeakKey[] {
  return Object.entries(mistakeCounts)
    .filter(([key, mistakes]) => /^[A-Z]$/.test(key) && mistakes > 0)
    .sort((first, second) => {
      if (second[1] !== first[1]) return second[1] - first[1];
      return first[0].localeCompare(second[0]);
    })
    .slice(0, limit)
    .map(([key, mistakes]) => ({ key, mistakes }));
}

export function aggregateMistakes(records: TestRecord[]) {
  return records.reduce<Record<string, number>>((totals, record) => {
    for (const [key, mistakes] of Object.entries(record.mistakeCounts)) {
      totals[key] = (totals[key] ?? 0) + mistakes;
    }
    return totals;
  }, {});
}

export function createWeakKeyPassage(keys: string[]) {
  const targetKeys = (keys.length ? keys : ["R", "T", "P"])
    .map((key) => key.toLowerCase())
    .slice(0, 5);
  const focusedWords = weakKeyWords.filter((word) =>
    targetKeys.some((key) => word.includes(key)),
  );
  const pool = focusedWords.length > 0 ? focusedWords : [...weakKeyWords];
  const words: string[] = [];

  while (words.length < 48) {
    const shuffled = [...pool];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapWith = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapWith]] = [
        shuffled[swapWith],
        shuffled[index],
      ];
    }
    words.push(...shuffled);
  }

  return words
    .slice(0, 48)
    .map((word, index) => {
      const sentenceStart = index % 12 === 0;
      const sentenceEnd = index % 12 === 11;
      const formatted = sentenceStart
        ? `${word.charAt(0).toUpperCase()}${word.slice(1)}`
        : word;
      return sentenceEnd ? `${formatted}.` : formatted;
    })
    .join(" ");
}

export function readStoredHistory(value: string | null): TestRecord[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isTestRecord)
      .map((record) => ({
        ...record,
        // Preserve history written by the previous schema. New sessions
        // always store exact whole-word counts.
        correctWords:
          typeof record.correctWords === "number"
            ? record.correctWords
            : Math.floor(record.correctCharacters / 5),
        incorrectWords:
          typeof record.incorrectWords === "number" ? record.incorrectWords : 0,
      }))
      .slice(-MAX_HISTORY_ITEMS);
  } catch {
    return [];
  }
}

function isTestRecord(value: unknown): value is TestRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<TestRecord>;

  return (
    typeof record.id === "string" &&
    typeof record.completedAt === "string" &&
    typeof record.wpm === "number" &&
    typeof record.accuracy === "number" &&
    typeof record.totalCharacters === "number" &&
    typeof record.correctCharacters === "number" &&
    typeof record.incorrectCharacters === "number" &&
    typeof record.totalErrors === "number" &&
    typeof record.timeTakenSeconds === "number" &&
    typeof record.mistakeCounts === "object" &&
    record.mistakeCounts !== null
  );
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0
    ? `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`
    : `${remainingSeconds}s`;
}
