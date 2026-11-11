"use client";

import Link from "next/link";
import axios from "axios";
import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import API from "@/lib/axios";
import type { ApiResponse, NewsSummaryData, SummaryMode } from "@/types";

interface SavedBriefing {
  id: string;
  topic: string;
  mode: SummaryMode;
  data: NewsSummaryData;
  createdAt: string;
}

const HISTORY_KEY = "daily-catchup:briefings";
const HISTORY_EVENT = "daily-catchup:history-changed";
const MODES: { value: SummaryMode; title: string; detail: string }[] = [
  { value: "brief", title: "Quick read", detail: "The essentials" },
  { value: "standard", title: "Balanced", detail: "A little context" },
  { value: "detailed", title: "Deep dive", detail: "More perspective" },
];
const SUGGESTED_TOPICS = ["Artificial intelligence", "Climate", "Global markets"];
let fallbackHistorySnapshot = "[]";
let historyReadErrorReported = false;

function subscribeToHistory(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(HISTORY_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(HISTORY_EVENT, callback);
  };
}

function getHistorySnapshot() {
  try {
    fallbackHistorySnapshot = window.localStorage.getItem(HISTORY_KEY) ?? "[]";
    return fallbackHistorySnapshot;
  } catch (storageError) {
    if (!historyReadErrorReported) {
      console.error("Could not read saved briefings:", storageError);
      historyReadErrorReported = true;
    }
    return fallbackHistorySnapshot;
  }
}

function getServerHistorySnapshot() {
  return "[]";
}

function normalizeSummary(value: unknown): NewsSummaryData | null {
  if (!value || typeof value !== "object") return null;
  const summary = value as Record<string, unknown>;
  if (
    typeof summary.title !== "string" ||
    typeof summary.executiveSummary !== "string" ||
    !Array.isArray(summary.bulletPoints)
  ) {
    return null;
  }

  const bulletPoints = summary.bulletPoints.filter(
    (point): point is string => typeof point === "string",
  );
  if (bulletPoints.length !== summary.bulletPoints.length) return null;

  const sources = Array.isArray(summary.sources)
    ? summary.sources.filter(
        (source): source is { title: string; url: string } =>
          Boolean(source) &&
          typeof source === "object" &&
          typeof source.title === "string" &&
          typeof source.url === "string",
      )
    : undefined;

  return {
    title: summary.title,
    executiveSummary: summary.executiveSummary,
    bulletPoints,
    sentiment: typeof summary.sentiment === "string" ? summary.sentiment : undefined,
    sources,
  };
}

function parseHistory(snapshot: string): SavedBriefing[] {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item): SavedBriefing[] => {
      if (!item || typeof item !== "object") return [];
      const candidate = item as Record<string, unknown>;
      const data = normalizeSummary(candidate.data);
      const validMode = MODES.find((option) => option.value === candidate.mode)?.value;
      const createdAt = typeof candidate.createdAt === "string" ? candidate.createdAt : "";
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.topic !== "string" ||
        !data ||
        !validMode ||
        !Number.isFinite(Date.parse(createdAt))
      ) {
        return [];
      }
      return [{
        id: candidate.id,
        topic: candidate.topic,
        mode: validMode,
        data,
        createdAt,
      }];
    }).slice(0, 6);
  } catch (storageError) {
    console.error("Could not parse saved briefings:", storageError);
    return [];
  }
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function sentimentClass(sentiment?: string) {
  const normalized = sentiment?.toLowerCase();
  if (normalized === "positive") return "sentiment-positive";
  if (normalized === "negative") return "sentiment-negative";
  return "sentiment-neutral";
}

function getSafeSourceUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    console.error("Ignoring a news source with an unsafe URL:", rawUrl);
  } catch (sourceError) {
    console.error("Ignoring a news source with an invalid URL:", sourceError);
  }
  return null;
}

export default function DashboardPage() {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<SummaryMode>("standard");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [current, setCurrent] = useState<SavedBriefing | null>(null);
  const historySnapshot = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getServerHistorySnapshot,
  );
  const history = useMemo(() => parseHistory(historySnapshot), [historySnapshot]);

  function persistHistory(nextHistory: SavedBriefing[]) {
    try {
      const snapshot = JSON.stringify(nextHistory);
      window.localStorage.setItem(HISTORY_KEY, snapshot);
      fallbackHistorySnapshot = snapshot;
    } catch (storageError) {
      console.error("Could not save this briefing:", storageError);
      fallbackHistorySnapshot = JSON.stringify(nextHistory);
      setNotice("This briefing is ready, but your browser couldn’t save it for later.");
    }
    window.dispatchEvent(new Event(HISTORY_EVENT));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const searchTopic = topic.trim();
    if (searchTopic.length < 2) {
      setError("Enter at least two characters to search for a topic.");
      return;
    }

    setError("");
    setNotice("");
    setIsLoading(true);
    try {
      const response = await API.post<ApiResponse<NewsSummaryData>>("/news/summarize", {
        topic: searchTopic,
        mode,
      });
      const payload = response.data;

      if (!payload.success) {
        throw new Error(payload.message || "We couldn’t create a briefing for that topic.");
      }

      const summary = normalizeSummary(payload.data);
      if (!summary) {
        throw new Error("The news service returned an unexpected briefing. Please try again.");
      }

      const briefing: SavedBriefing = {
        id: globalThis.crypto.randomUUID(),
        topic: searchTopic,
        mode,
        data: summary,
        createdAt: new Date().toISOString(),
      };
      setCurrent(briefing);
      persistHistory([briefing, ...history.filter((item) => item.topic.toLowerCase() !== searchTopic.toLowerCase())].slice(0, 6));
    } catch (requestError) {
      if (axios.isAxiosError<{ message?: string }>(requestError)) {
        setError(
          requestError.response?.data?.message ||
            (requestError.response
              ? "We couldn’t create that briefing. Please try another topic."
              : "Couldn’t reach the news service. Check your connection and try again."),
        );
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Something went wrong while creating your briefing. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  function clearHistory() {
    persistHistory([]);
    setNotice("Your saved briefings have been cleared.");
    if (current) setCurrent(null);
  }

  function selectBriefing(briefing: SavedBriefing) {
    setCurrent(briefing);
    setTopic(briefing.topic);
    setMode(briefing.mode);
    setError("");
    setNotice("");
  }

  return (
    <main className="workspace">
      <aside className="workspace-sidebar">
        <Link className="brand workspace-brand" href="/" aria-label="Daily CatchUp home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>daily<span className="brand-light">catchup</span></span>
        </Link>
        <span className="sidebar-label">YOUR SPACE</span>
        <Link className="sidebar-item sidebar-item-active" href="/dashboard"><span aria-hidden="true">✳</span> Today&apos;s briefing</Link>
        <div className="sidebar-divider" />
        <div className="sidebar-history-heading">
          <span className="sidebar-label">RECENT BRIEFINGS</span>
          {history.length > 0 && <button className="clear-history" onClick={clearHistory} type="button">Clear</button>}
        </div>
        {history.length > 0 ? (
          <div className="history-list">
            {history.map((item) => (
              <button
                className={`history-item${current?.id === item.id ? " history-item-active" : ""}`}
                key={item.id}
                onClick={() => selectBriefing(item)}
                type="button"
              >
                <span className="history-bullet" aria-hidden="true" />
                <span className="history-item-copy"><strong>{item.topic}</strong><small>{formatTime(item.createdAt)}</small></span>
              </button>
            ))}
          </div>
        ) : (
          <p className="history-empty">Your briefings will appear here after your first search.</p>
        )}
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><span aria-hidden="true">✧</span><p><strong>A small tip</strong>Try a question or a topic. The more specific you are, the better your briefing.</p></div>
          <Link className="sidebar-home-link" href="/">← Back to home</Link>
        </div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-header">
          <div className="mobile-brand">
            <Link className="brand" href="/">
              <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
              <span>daily<span className="brand-light">catchup</span></span>
            </Link>
          </div>
          <div className="workspace-date"><span className="date-dot" /> YOUR PERSONAL NEWS DESK</div>
          <Link className="workspace-account" href="/login">Account <span aria-hidden="true">↗</span></Link>
        </header>

        <div className="workspace-content">
          <div className="workspace-welcome">
            <span className="section-kicker">YOUR NEWS, IN FOCUS</span>
            <h1>Let&apos;s catch you <em>up.</em></h1>
            <p>Your curiosity, met with context. What would you like to understand today?</p>
          </div>

          <form className="briefing-form" onSubmit={handleSubmit}>
            <label className="topic-label" htmlFor="topic">WHAT&apos;S ON YOUR MIND?</label>
            <div className="topic-input-wrap">
              <span className="topic-search-icon" aria-hidden="true">⌕</span>
              <input
                autoComplete="off"
                id="topic"
                maxLength={180}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Try “What’s happening with clean energy?”"
                value={topic}
              />
              {topic && <button className="topic-clear" aria-label="Clear topic" onClick={() => setTopic("")} type="button">×</button>}
            </div>
            <div className="suggested-topics">
              <span>TRY</span>
              {SUGGESTED_TOPICS.map((suggestion) => (
                <button key={suggestion} onClick={() => setTopic(suggestion)} type="button">{suggestion}</button>
              ))}
            </div>

            <div className="mode-row">
              <span className="topic-label">HOW MUCH DETAIL?</span>
              <div className="mode-options" role="group" aria-label="Briefing detail level">
                {MODES.map((option) => (
                  <button
                    aria-pressed={mode === option.value}
                    className={`mode-option${mode === option.value ? " mode-option-active" : ""}`}
                    key={option.value}
                    onClick={() => setMode(option.value)}
                    type="button"
                  >
                    <strong>{option.title}</strong><span>{option.detail}</span>
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="dashboard-error" role="alert">{error}</p>}
            {notice && <p className="dashboard-notice" role="status">{notice}</p>}
            <button className="button button-dark briefing-submit" disabled={isLoading} type="submit">
              {isLoading ? <><span className="button-spinner" aria-hidden="true" /> Finding the signal…</> : <>Create my briefing <span aria-hidden="true">↗</span></>}
            </button>
            <p className="form-footnote"><span aria-hidden="true">✦</span> Built from live reporting. Always follow the original sources.</p>
          </form>

          {isLoading && (
            <section className="result-card result-loading" aria-live="polite">
              <div className="result-loading-top"><span className="loading-pulse" /><span>GATHERING THE LATEST STORIES</span></div>
              <div className="loading-line loading-line-long" /><div className="loading-line" /><div className="loading-line loading-line-short" />
              <div className="loading-bullet" /><div className="loading-bullet loading-bullet-short" />
            </section>
          )}

          {!isLoading && current && (
            <article className="result-card" aria-live="polite">
              <div className="result-topline">
                <span className="result-eyebrow"><span className="result-live-dot" /> YOUR BRIEFING</span>
                <span className={`sentiment-badge ${sentimentClass(current.data.sentiment)}`}>
                  <span aria-hidden="true">●</span> {current.data.sentiment || "Balanced"}
                </span>
              </div>
              <p className="result-topic">{current.topic} <span>· {MODES.find((option) => option.value === current.mode)?.title}</span></p>
              <h2>{current.data.title}</h2>
              <p className="result-summary">{current.data.executiveSummary}</p>
              {current.data.bulletPoints.length > 0 && (
                <div className="takeaways">
                  <span className="topic-label">THE KEY TAKEAWAYS</span>
                  <ul>
                    {current.data.bulletPoints.map((point, index) => (
                      <li key={`${index}-${point}`}><span className="takeaway-number">0{index + 1}</span><span>{point}</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {current.data.sources && current.data.sources.length > 0 && (
                <div className="sources">
                  <span className="topic-label">GO A LITTLE DEEPER</span>
                  <div className="source-list">
                      {current.data.sources.map((source, index) => {
                        const sourceUrl = getSafeSourceUrl(source.url);
                        const sourceTitle = source.title || "Original news source";
                        return sourceUrl ? (
                          <a href={sourceUrl} key={`${source.url}-${index}`} rel="noopener noreferrer" target="_blank">
                            <span>{sourceTitle}</span><span aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          <span className="source-unavailable" key={`${source.url}-${index}`}>{sourceTitle}</span>
                        );
                      })}
                    </div>
                  </div>
              )}
              <div className="result-footer"><span>DAILY CATCHUP · {formatTime(current.createdAt)}</span><span>✦ MADE FOR YOUR CURIOSITY</span></div>
            </article>
          )}

          {!isLoading && !current && (
            <section className="empty-result">
              <div className="empty-result-icon" aria-hidden="true">✳</div>
              <div><span className="section-kicker">A LITTLE MORE CONTEXT</span><h2>Your next briefing<br />starts with a question.</h2><p>Search a topic above and we&apos;ll bring the latest stories into focus.</p></div>
              <span className="empty-decoration" aria-hidden="true">✧</span>
            </section>
          )}

          <footer className="workspace-footer"><span>Stay curious. Stay informed.</span><span>AI summaries can miss context—check the sources.</span></footer>
        </div>
      </section>
    </main>
  );
}
