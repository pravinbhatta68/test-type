import ProgressChart from "./progress-chart";
import {
  formatDuration,
  getWeakKeys,
  type TestRecord,
} from "./typing-analytics";

type ResultsDashboardProps = {
  result: TestRecord;
  history: TestRecord[];
  personalBest: number;
  isNewPersonalBest: boolean;
  onTryAgain: () => void;
  onPracticeWeakKeys: () => void;
  onChangeSettings: () => void;
};

export default function ResultsDashboard({
  result,
  history,
  personalBest,
  isNewPersonalBest,
  onTryAgain,
  onPracticeWeakKeys,
  onChangeSettings,
}: ResultsDashboardProps) {
  const weakKeys = getWeakKeys(result.mistakeCounts);

  return (
    <section className="results-dashboard" aria-live="polite">
      <div className="result-card">
        <div className="result-copy">
          <p className="eyebrow">
            <span>Done</span> Session complete
          </p>
          {isNewPersonalBest && (
            <p className="personal-best-badge">New Personal Best 🎉</p>
          )}
          <h2>
            Nice flow.
            <br />
            <em>Keep it growing.</em>
          </h2>
          <p>
            Your speed uses fully correct words, while character accuracy still
            scores every key independently. Review the details, then choose your
            next practice.
          </p>
          <div className="result-actions">
            <button className="start-button" type="button" onClick={onTryAgain}>
              Try Again <span aria-hidden="true">↗</span>
            </button>
            <button
              className="secondary-button weak-practice-button"
              type="button"
              onClick={onPracticeWeakKeys}
            >
              Practice Weak Keys
            </button>
            <button
              className="settings-button"
              type="button"
              onClick={onChangeSettings}
            >
              Change settings
            </button>
          </div>
        </div>

        <div className="score-board">
          <div className="hero-score yellow-score">
            <span>Final speed</span>
            <strong>{result.wpm}</strong>
            <small>words / minute</small>
          </div>
          <div className="hero-score pink-score">
            <span>Accuracy</span>
            <strong>{result.accuracy}%</strong>
            <small>{result.incorrectCharacters} currently incorrect</small>
          </div>
          <div className="detail-row result-detail-grid">
            <div><span>Total typed</span><strong>{result.totalCharacters}</strong></div>
            <div><span>Correct</span><strong>{result.correctCharacters}</strong></div>
            <div><span>Incorrect</span><strong>{result.incorrectCharacters}</strong></div>
            <div><span>Correct words</span><strong>{result.correctWords}</strong></div>
            <div><span>Incorrect words</span><strong>{result.incorrectWords}</strong></div>
            <div><span>Total errors</span><strong>{result.totalErrors}</strong></div>
            <div><span>Time taken</span><strong>{formatDuration(result.timeTakenSeconds)}</strong></div>
            <div><span>Personal best</span><strong>{personalBest} WPM</strong></div>
          </div>
        </div>
      </div>

      <div className="result-insights">
        <section className="weak-keys-card" aria-labelledby="weak-keys-title">
          <div className="insight-heading">
            <span className="step-number pink">WK</span>
            <div>
              <p>Focused feedback</p>
              <h3 id="weak-keys-title">Keys You Should Practice</h3>
            </div>
          </div>
          {weakKeys.length > 0 ? (
            <ol className="weak-key-list">
              {weakKeys.map((item) => (
                <li key={item.key}>
                  <kbd>{item.key}</kbd>
                  <span>{item.mistakes} {item.mistakes === 1 ? "mistake" : "mistakes"}</span>
                  <i style={{ width: `${Math.max(16, (item.mistakes / weakKeys[0].mistakes) * 100)}%` }} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="no-weak-keys">
              No weak letter keys detected in this test. Excellent accuracy.
            </p>
          )}
        </section>

        <section className="progress-card" aria-labelledby="progress-title">
          <div className="insight-heading compact-heading">
            <div>
              <p>Stored on this device</p>
              <h3 id="progress-title">Recent Progress</h3>
            </div>
            <span className="history-count">Last {history.length} / 10</span>
          </div>
          <ProgressChart history={history} />
        </section>
      </div>
    </section>
  );
}
