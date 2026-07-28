"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sampleBank, type Difficulty } from "./samples";

type Phase = "setup" | "running" | "finished";

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

export default function Home() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [duration, setDuration] = useState<(typeof durations)[number]>(1);
  const [phase, setPhase] = useState<Phase>("setup");
  const [passage, setPassage] = useState(
    () => sampleBank.find((sample) => sample.difficulty === "easy")?.text ?? "",
  );
  const [typed, setTyped] = useState("");
  const [remaining, setRemaining] = useState(60);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const currentRef = useRef<HTMLSpanElement>(null);

  const stats = useMemo(() => {
    let correct = 0;
    for (let index = 0; index < typed.length; index += 1) {
      if (typed[index] === passage[index]) correct += 1;
    }
    const elapsed = Math.max(1, duration * 60 - remaining);
    const wpm = Math.round(correct / 5 / (elapsed / 60));
    const accuracy = typed.length
      ? Math.round((correct / typed.length) * 100)
      : 100;
    return {
      correct,
      errors: typed.length - correct,
      wpm,
      accuracy,
      characters: typed.length,
    };
  }, [duration, passage, remaining, typed]);

  const finishTest = useCallback(() => {
    setPhase("finished");
    setStartedAt(null);
  }, []);

  useEffect(() => {
    if (phase !== "running" || startedAt === null) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const next = Math.max(0, duration * 60 - elapsed);
      setRemaining(next);
      if (next === 0) finishTest();
    };

    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [duration, finishTest, phase, startedAt]);

  useEffect(() => {
    if (phase === "running") inputRef.current?.focus();
  }, [phase]);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [typed.length]);

  const startTest = () => {
    setPassage(createPassage(difficulty, duration));
    setTyped("");
    setRemaining(duration * 60);
    setPhase("running");
    setStartedAt(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const returnToSetup = () => {
    setPhase("setup");
    setTyped("");
    setRemaining(duration * 60);
    setStartedAt(null);
  };

  const handleInput = (value: string) => {
    if (phase !== "running") return;
    const next = value.slice(0, passage.length);
    if (startedAt === null && next.length > 0) {
      setStartedAt(Date.now());
    }
    setTyped(next);
    if (next.length === passage.length) {
      window.setTimeout(finishTest, 0);
    }
  };

  const progress = Math.min(100, (typed.length / passage.length) * 100 || 0);
  const selectedDifficulty = difficultyCopy[difficulty];

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="TypeBloom home">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <span>TypeBloom</span>
        </a>
        <div className="topbar-actions">
          <span className="header-chip">Focus studio</span>
          <div className="topbar-note">
            <span className="live-dot" aria-hidden="true" />
            100 fresh practice samples
          </div>
        </div>
      </header>

      <section className="intro">
        <div className="intro-main">
          <p className="eyebrow">
            <span>01</span> Daily typing practice
          </p>
          <h1>
            Find your <em>rhythm.</em>
          </h1>
        </div>
        <div className="intro-side">
          <p className="intro-copy">
            Build speed without losing precision. Pick your pace, settle in,
            and let your fingers do the thinking.
          </p>
          <div className="key-row" aria-hidden="true">
            <div className="box-opening" />
            <div className="letter-launch">
              {["T", "Y", "P", "E"].map((letter) => (
                <span className="pop-letter" key={letter}>
                  <i />
                  <b>{letter}</b>
                </span>
              ))}
            </div>
            <div className="box-front">
              <span>TypeBloom</span>
              <b>04 / studio keys</b>
            </div>
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
                <span>{selectedDifficulty.marker}</span>
                {selectedDifficulty.label} · {duration} min
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
              aria-hidden="true"
              onClick={() => inputRef.current?.focus()}
            >
              {passage.split("").map((character, index) => {
                let className = "pending";
                if (index < typed.length) {
                  className = typed[index] === character ? "correct" : "incorrect";
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
          </aside>
        </section>
      )}

      {phase === "finished" && (
        <section className="result-card" aria-live="polite">
          <div className="result-copy">
            <p className="eyebrow">
              <span>Done</span> Session complete
            </p>
            <h2>
              Nice flow.
              <br />
              <em>Keep it growing.</em>
            </h2>
            <p>
              Your result uses correct keystrokes, so speed and precision both
              count. Come back tomorrow and make the rhythm feel even easier.
            </p>
            <div className="result-actions">
              <button className="start-button" type="button" onClick={startTest}>
                Try a new sample <span aria-hidden="true">↗</span>
              </button>
              <button className="secondary-button" type="button" onClick={returnToSetup}>
                Change settings
              </button>
            </div>
          </div>

          <div className="score-board">
            <div className="hero-score yellow-score">
              <span>Your speed</span>
              <strong>{stats.wpm}</strong>
              <small>words / minute</small>
            </div>
            <div className="hero-score pink-score">
              <span>Accuracy</span>
              <strong>{stats.accuracy}%</strong>
              <small>{stats.errors} errors</small>
            </div>
            <div className="detail-row">
              <div>
                <span>Correct keys</span>
                <strong>{stats.correct}</strong>
              </div>
              <div>
                <span>Characters</span>
                <strong>{stats.characters}</strong>
              </div>
              <div>
                <span>Duration</span>
                <strong>{duration} min</strong>
              </div>
            </div>
          </div>
        </section>
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
