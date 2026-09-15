"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import ResultsDashboard from "./results-dashboard";
import { sampleBank, type Difficulty } from "./samples";
import {
  aggregateMistakes,
  calculatePerformance,
  charactersMatch,
  createWeakKeyPassage,
  getWeakKeys,
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_ITEMS,
  PERSONAL_BEST_STORAGE_KEY,
  readStoredHistory,
  type TestMode,
  type TestRecord,
} from "./typing-analytics";

type Phase = "setup" | "running" | "finished";

type TypingPracticeProps = {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
};

const difficultyCopy: Record<
  Difficulty,
  { label: string; note: string; marker: string }
> = {
  easy: { label: "Easy", note: "Common words", marker: "Aa" },
  medium: { label: "Medium", note: "Punctuation", marker: "A;" },
  hard: { label: "Hard", note: "Numbers & symbols", marker: "#1" },
};

const durations = [1, 3, 5] as const;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapWith]] = [copy[swapWith], copy[index]];
  }
  return copy;
}

function createPassage(difficulty: Difficulty, minutes: number) {
  const pool = sampleBank.filter((sample) => sample.difficulty === difficulty);
  const targetWords = minutes * 250 + 80;
  const paragraphs: string[] = [];
  let wordCount = 0;

  while (wordCount < targetWords) {
    for (const sample of shuffle(pool)) {
      paragraphs.push(sample.text);
      wordCount += sample.text.split(/\s+/).length;
      if (wordCount >= targetWords) break;
    }
  }

  return paragraphs.join(" ");
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function TypingPractice({ user }: TypingPracticeProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [duration, setDuration] = useState<(typeof durations)[number]>(1);
  const [phase, setPhase] = useState<Phase>("setup");
  const [passage, setPassage] = useState(
    () => sampleBank.find((sample) => sample.difficulty === "easy")?.text ?? "",
  );
  const [typed, setTyped] = useState("");
  const [remaining, setRemaining] = useState(60);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [testDurationSeconds, setTestDurationSeconds] = useState(60);
  const [testMode, setTestMode] = useState<TestMode>("standard");
  const [totalErrors, setTotalErrors] = useState(0);
  const [history, setHistory] = useState<TestRecord[]>([]);
  const [personalBest, setPersonalBest] = useState(0);
  const [finalResult, setFinalResult] = useState<TestRecord | null>(null);
  const [isNewPersonalBest, setIsNewPersonalBest] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const passageViewportRef = useRef<HTMLDivElement>(null);
  const passageTrackRef = useRef<HTMLSpanElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);
  const trackOffsetRef = useRef(0);
  const trackTargetOffsetRef = useRef(0);
  const trackAnimationRef = useRef<number | null>(null);
  const typedRef = useRef("");
  const startedAtRef = useRef<number | null>(null);
  const totalErrorsRef = useRef(0);
  const mistakeCountsRef = useRef<Record<string, number>>({});
  const hasFinishedRef = useRef(false);

  const stats = useMemo(() => {
    const elapsed = Math.max(1, testDurationSeconds - remaining);
    return {
      ...calculatePerformance(typed, passage, elapsed),
      totalErrors,
    };
  }, [passage, remaining, testDurationSeconds, totalErrors, typed]);

  useEffect(() => {
    const storedHistory = readStoredHistory(
      window.localStorage.getItem(HISTORY_STORAGE_KEY),
    );
    const storedBest = Number.parseInt(
      window.localStorage.getItem(PERSONAL_BEST_STORAGE_KEY) ?? "0",
      10,
    );
    const bestFromHistory = storedHistory.reduce(
      (best, record) => Math.max(best, record.wpm),
      0,
    );

    const hydrationTimer = window.setTimeout(() => {
      setHistory(storedHistory);
      setPersonalBest(
        Math.max(Number.isFinite(storedBest) ? storedBest : 0, bestFromHistory),
      );
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  const finishTest = useCallback((finalTyped: string, elapsedSeconds: number) => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    const safeElapsed = Math.max(1, Math.min(testDurationSeconds, elapsedSeconds));
    const performance = calculatePerformance(finalTyped, passage, safeElapsed);
    const result: TestRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      completedAt: new Date().toISOString(),
      wpm: performance.wpm,
      accuracy: performance.accuracy,
      totalCharacters: finalTyped.length,
      correctCharacters: performance.correct,
      incorrectCharacters: performance.errors,
      correctWords: performance.correctWords,
      incorrectWords: performance.incorrectWords,
      totalErrors: totalErrorsRef.current,
      timeTakenSeconds: safeElapsed,
      difficulty,
      durationMinutes: Math.ceil(testDurationSeconds / 60),
      mode: testMode,
      mistakeCounts: { ...mistakeCountsRef.current },
    };

    setFinalResult(result);
    setIsNewPersonalBest(result.wpm > personalBest);
    setPersonalBest((previousBest) => {
      const nextBest = Math.max(previousBest, result.wpm);
      window.localStorage.setItem(PERSONAL_BEST_STORAGE_KEY, String(nextBest));
      return nextBest;
    });
    setHistory((previousHistory) => {
      const nextHistory = [...previousHistory, result].slice(-MAX_HISTORY_ITEMS);
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
      return nextHistory;
    });
    setPhase("finished");
    setStartedAt(null);
    startedAtRef.current = null;
  }, [difficulty, passage, personalBest, testDurationSeconds, testMode]);

  useEffect(() => {
    if (phase !== "running" || startedAt === null) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const next = Math.max(0, testDurationSeconds - elapsed);
      setRemaining(next);
      if (next === 0) finishTest(typedRef.current, testDurationSeconds);
    };

    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [finishTest, phase, startedAt, testDurationSeconds]);

  useEffect(() => {
    if (phase === "running") inputRef.current?.focus();
  }, [phase]);

  const startTrackAnimation = useCallback(() => {
    if (trackAnimationRef.current !== null) return;

    let previousTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = Math.min(32, currentTime - previousTime);
      previousTime = currentTime;
      const currentOffset = trackOffsetRef.current;
      const targetOffset = trackTargetOffsetRef.current;
      const distance = targetOffset - currentOffset;
      const easing = 1 - Math.exp(-18 * (elapsed / 1000));
      const nextOffset =
        Math.abs(distance) < 0.12
          ? targetOffset
          : currentOffset + distance * easing;

      trackOffsetRef.current = nextOffset;
      if (passageTrackRef.current) {
        passageTrackRef.current.style.transform =
          `translate3d(${nextOffset}px, 0, 0)`;
      }

      if (nextOffset === targetOffset) {
        trackAnimationRef.current = null;
        return;
      }
      trackAnimationRef.current = window.requestAnimationFrame(animate);
    };

    trackAnimationRef.current = window.requestAnimationFrame(animate);
  }, []);

  const updateTrackTarget = useCallback((moveImmediately = false) => {
    const viewport = passageViewportRef.current;
    const track = passageTrackRef.current;
    const current = currentRef.current;
    if (!viewport || !track || !current) return;

    const focusPoint = viewport.clientWidth * 0.38;
    const desiredOffset = focusPoint - current.offsetLeft;
    const furthestOffset = Math.min(0, viewport.clientWidth - track.scrollWidth);
    const targetOffset = Math.max(
      furthestOffset,
      Math.min(0, desiredOffset),
    );
    trackTargetOffsetRef.current = targetOffset;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (moveImmediately || prefersReducedMotion) {
      if (trackAnimationRef.current !== null) {
        window.cancelAnimationFrame(trackAnimationRef.current);
        trackAnimationRef.current = null;
      }
      trackOffsetRef.current = targetOffset;
      track.style.transform = `translate3d(${targetOffset}px, 0, 0)`;
      return;
    }

    startTrackAnimation();
  }, [startTrackAnimation]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      updateTrackTarget(typed.length === 0);
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [passage, typed.length, updateTrackTarget]);

  useEffect(() => {
    const handleResize = () => updateTrackTarget(typedRef.current.length === 0);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (trackAnimationRef.current !== null) {
        window.cancelAnimationFrame(trackAnimationRef.current);
        trackAnimationRef.current = null;
      }
    };
  }, [updateTrackTarget]);

  const startSession = (
    nextPassage: string,
    durationSeconds: number,
    mode: TestMode,
  ) => {
    setPassage(nextPassage);
    setTyped("");
    typedRef.current = "";
    setRemaining(durationSeconds);
    setTestDurationSeconds(durationSeconds);
    setTestMode(mode);
    setTotalErrors(0);
    totalErrorsRef.current = 0;
    mistakeCountsRef.current = {};
    hasFinishedRef.current = false;
    setFinalResult(null);
    setIsNewPersonalBest(false);
    setPhase("running");
    setStartedAt(null);
    startedAtRef.current = null;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const startTest = () => {
    startSession(createPassage(difficulty, duration), duration * 60, "standard");
  };

  const startWeakKeyPractice = () => {
    const weakKeys = getWeakKeys(aggregateMistakes(history)).map(({ key }) => key);
    startSession(createWeakKeyPassage(weakKeys), 60, "weak-keys");
  };

  const returnToSetup = () => {
    setPhase("setup");
    setTyped("");
    typedRef.current = "";
    setRemaining(duration * 60);
    setTestDurationSeconds(duration * 60);
    setTestMode("standard");
    setTotalErrors(0);
    totalErrorsRef.current = 0;
    mistakeCountsRef.current = {};
    hasFinishedRef.current = false;
    setFinalResult(null);
    setIsNewPersonalBest(false);
    setStartedAt(null);
    startedAtRef.current = null;
  };

  const handleInput = (value: string) => {
    if (phase !== "running") return;
    const next = value.slice(0, passage.length);
    if (startedAtRef.current === null && next.length > 0) {
      const startTime = Date.now();
      setStartedAt(startTime);
      startedAtRef.current = startTime;
    }
    if (next.length > typed.length) {
      let addedErrors = 0;
      const nextMistakeCounts = { ...mistakeCountsRef.current };
      for (let index = typed.length; index < next.length; index += 1) {
        if (!charactersMatch(next[index], passage[index])) {
          addedErrors += 1;
          const expectedKey = passage[index]?.toUpperCase();
          if (/^[A-Z]$/.test(expectedKey)) {
            nextMistakeCounts[expectedKey] =
              (nextMistakeCounts[expectedKey] ?? 0) + 1;
          }
        }
      }
      if (addedErrors > 0) {
        totalErrorsRef.current += addedErrors;
        mistakeCountsRef.current = nextMistakeCounts;
        setTotalErrors(totalErrorsRef.current);
      }
    }
    setTyped(next);
    typedRef.current = next;
    if (next.length === passage.length) {
      const elapsed = startedAtRef.current
        ? Math.ceil((Date.now() - startedAtRef.current) / 1000)
        : 1;
      window.setTimeout(() => finishTest(next, elapsed), 0);
    }
  };

  const progress = Math.min(100, (typed.length / passage.length) * 100 || 0);
  const selectedDifficulty = difficultyCopy[difficulty];

  return (
    <main className="site-shell">
      <header className="topbar">
        <button
          className="brand"
          type="button"
          onClick={() => window.location.reload()}
          aria-label="Reload Digital Pravin typing practice"
        >
          <span className="brand-mark" aria-hidden="true">
            <b>D</b>
            <b>P</b>
          </span>
          <span className="brand-name">DIGITAL PRAVIN</span>
        </button>
        <div className="topbar-actions">
          <div className="topbar-note">
            <span className="live-dot" aria-hidden="true" />
            100 fresh practice samples
          </div>
          <span className="account-chip" title={user.email}>
            {user.image ? (
              <Image
                className="account-avatar"
                src={user.image}
                alt={`${user.name} profile picture`}
                width={28}
                height={28}
              />
            ) : (
              <b aria-hidden="true">{user.name.charAt(0).toUpperCase()}</b>
            )}
            <span className="account-copy">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
          </span>
          <button
            className="sign-out-control"
            type="button"
            disabled={isSigningOut}
            onClick={async () => {
              setIsSigningOut(true);
              await signOut({ redirectTo: "/login" });
            }}
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </header>

      <section className="intro">
        <div className="intro-main">
          <div className="intro-heading">
            <p className="eyebrow">
              <span>01</span> Daily typing practice
            </p>
            <h1>
              Find your <em>rhythm.</em>
            </h1>
          </div>
          <figure className="typing-portrait">
            <Image
              src="/digital-pravin-typing-table-crop.png"
              alt="Digital Pravin practicing typing at his desk"
              width="936"
              height="1120"
            />
            <figcaption>
              <span>Digital Pravin</span>
              Typing in flow
            </figcaption>
          </figure>
        </div>
        <div className="intro-side">
          <p className="intro-copy">
            Build speed without losing precision. Pick your pace, settle in,
            and let your fingers do the thinking.
          </p>
          <div className="key-row" aria-hidden="true">
            <span className="character-orbit character-orbit-yellow" />
            <span className="character-orbit character-orbit-pink" />
            <span className="character-shadow" />
            <Image
              src="/type-characters-3d.png"
              alt=""
              width="1536"
              height="1536"
              draggable="false"
            />
            <span className="character-label">3D studio type</span>
          </div>
        </div>
      </section>

      {phase === "setup" && (
        <>
          <div className="benefit-strip" aria-label="Practice benefits">
            <span>
              <b>01</b> Character-level feedback
            </span>
            <span>
              <b>02</b> Fresh text every session
            </span>
            <span>
              <b>03</b> Accurate WPM scoring
            </span>
          </div>
          <section className="setup-grid" aria-label="Test settings">
            <div className="panel difficulty-panel">
            <div className="panel-heading">
              <span className="step-number">1</span>
              <div>
                <h2>Choose your level</h2>
                <p>We’ll match the vocabulary to your comfort zone.</p>
              </div>
            </div>

            <div className="choice-grid">
              {(Object.keys(difficultyCopy) as Difficulty[]).map((level) => {
                const option = difficultyCopy[level];
                return (
                  <button
                    className={`choice-card ${difficulty === level ? "selected" : ""}`}
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    aria-pressed={difficulty === level}
                  >
                    <span className="choice-marker">{option.marker}</span>
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.note}</small>
                    </span>
                    <span className="radio" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
            </div>

            <div className="panel duration-panel">
            <div className="panel-heading">
              <span className="step-number pink">2</span>
              <div>
                <h2>Set the clock</h2>
                <p>How long do you want to stay in the flow?</p>
              </div>
            </div>

            <div className="duration-options">
              {durations.map((minutes) => (
                <button
                  className={duration === minutes ? "active" : ""}
                  key={minutes}
                  type="button"
                  onClick={() => setDuration(minutes)}
                  aria-pressed={duration === minutes}
                >
                  <strong>{minutes}</strong>
                  <span>min</span>
                </button>
              ))}
            </div>

            <button className="start-button" type="button" onClick={startTest}>
              Start typing
              <span aria-hidden="true">↗</span>
            </button>
            <p className="keyboard-hint">
              The clock waits for your first keystroke
            </p>
            </div>
          </section>
        </>
      )}

      {phase === "running" && (
        <section className="test-layout" aria-label="Typing test">
          <div className="typing-card">
            <div className="test-toolbar">
              <div className="test-tag">
                <span>{testMode === "weak-keys" ? "WK" : selectedDifficulty.marker}</span>
                {testMode === "weak-keys"
                  ? "Weak keys · 1 min"
                  : `${selectedDifficulty.label} · ${duration} min`}
              </div>
              <div className="toolbar-right">
                <span className={`test-status ${startedAt === null ? "waiting" : ""}`}>
                  <i aria-hidden="true" />
                  {startedAt === null ? "Waiting for you" : "Test in progress"}
                </span>
                <button className="text-button" type="button" onClick={returnToSetup}>
                  Restart
                </button>
              </div>
            </div>

            <div className="progress-track" aria-label={`${Math.round(progress)}% complete`}>
              <span style={{ width: `${progress}%` }} />
            </div>

            <div
              className="passage"
              ref={passageViewportRef}
              aria-hidden="true"
              onClick={() => inputRef.current?.focus()}
            >
              <span className="passage-track" ref={passageTrackRef}>
                {passage.split("").map((character, index) => {
                  let className = "pending";
                  if (index < typed.length) {
                    className = charactersMatch(typed[index], character)
                      ? "correct"
                      : "incorrect";
                  } else if (index === typed.length) {
                    className = "current";
                  }
                  return (
                    <span
                      // Character position is stable for the life of each passage.
                      key={index}
                      className={className}
                      ref={index === typed.length ? currentRef : undefined}
                    >
                      {character}
                    </span>
                  );
                })}
              </span>
            </div>

            <textarea
              ref={inputRef}
              className="typing-input"
              value={typed}
              onChange={(event) => handleInput(event.target.value)}
              aria-label="Type the displayed passage here"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <p className="focus-note">
              {startedAt === null
                ? "Type your first character when you’re ready — the timer is paused."
                : "Keep typing — mistakes are highlighted, and backspace is welcome."}
            </p>
          </div>

          <aside className="live-stats">
            <div className={`timer-card ${startedAt === null ? "timer-waiting" : ""}`}>
              <span>{startedAt === null ? "Starts on first key" : "Time left"}</span>
              <strong>{formatTime(remaining)}</strong>
              <div className="timer-orbit" aria-hidden="true">
                <span />
              </div>
            </div>
            <div className="live-stat-grid">
              <div className="mini-stat">
                <span>Live pace</span>
                <strong>{stats.wpm}</strong>
                <small>WPM</small>
              </div>
              <div className="mini-stat pink-stat">
                <span>Accuracy</span>
                <strong>{stats.accuracy}</strong>
                <small>%</small>
              </div>
              <div className="mini-stat compact-stat">
                <span>Correct</span>
                <strong>{stats.correct}</strong>
                <small>keys</small>
              </div>
              <div className="mini-stat compact-stat error-stat">
                <span>Errors</span>
                <strong>{stats.totalErrors}</strong>
                <small>total</small>
              </div>
            </div>
          </aside>
        </section>
      )}

      {phase === "finished" && finalResult && (
        <ResultsDashboard
          result={finalResult}
          history={history}
          personalBest={personalBest}
          isNewPersonalBest={isNewPersonalBest}
          onTryAgain={startTest}
          onPracticeWeakKeys={startWeakKeyPractice}
          onChangeSettings={returnToSetup}
        />
      )}

      <footer>
        <p>Made for steady hands and curious minds.</p>
        <p>
          Vocabulary informed by the{" "}
          <a
            href="https://github.com/first20hours/google-10000-english"
            target="_blank"
            rel="noreferrer"
          >
            Google Trillion Word Corpus
          </a>
          .
        </p>
      </footer>
    </main>
  );
}
