"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Audio Overview — NotebookLM-generated product walkthrough.
 *
 * The audio file is served as a static asset from /public/audio/.
 * Switch AUDIO_OVERVIEW_SRC if a different extension is provided in the future
 * (mp3, m4a, ogg, etc. — all natively supported by modern browsers).
 */
export const AUDIO_OVERVIEW_SRC = "/audio/trustguard-overview.m4a";
const AUDIO_DURATION_LABEL = "6:12 overview";
const AUDIO_DURATION_FALLBACK_SECONDS = 372; // 6:12 (used for waveform while metadata loads)

const TRANSCRIPT_PLACEHOLDER =
  "Transcript placeholder. Add the final NotebookLM transcript here if needed.";

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${ss}`;
}

export default function AudioOverviewCard() {
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(AUDIO_DURATION_FALLBACK_SECONDS);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveRef = useRef<HTMLDivElement | null>(null);

  // Cleanup on unmount: pause any playback.
  useEffect(() => {
    const el = audioRef.current;
    return () => {
      el?.pause();
    };
  }, []);

  function togglePlay() {
    const el = audioRef.current;
    if (!el || audioError) return;
    if (el.paused) {
      el.play().catch(() => setAudioError(true));
    } else {
      el.pause();
    }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current;
    const wave = waveRef.current;
    if (!el || !wave || !duration || audioError) return;
    const rect = wave.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * duration;
    setCurrent(el.currentTime);
  }

  const progress =
    duration > 0 ? Math.max(0, Math.min(1, current / duration)) : 0;
  const progressBarIdx = Math.round(progress * WAVE_HEIGHTS.length);

  return (
    <section
      className="glass"
      style={{
        padding: 20,
        borderRadius: 14,
        border: "1px solid var(--border-warm)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.32)",
      }}
    >
      <audio
        ref={audioRef}
        src={AUDIO_OVERVIEW_SRC}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = (e.currentTarget as HTMLAudioElement).duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onTimeUpdate={(e) =>
          setCurrent((e.currentTarget as HTMLAudioElement).currentTime)
        }
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setAudioError(true)}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "#F59E2E" }}
          >
            Audio Overview
          </div>
          <h3 className="text-base font-semibold mt-0.5 text-[var(--ink-0)]">
            Listen to a 6-minute product overview
          </h3>
          <p className="text-xs text-[var(--ink-2)] mt-1 max-w-xl leading-relaxed">
            NotebookLM-generated product overview. Use this for a quick walkthrough
            of TrustGuard before or during the demo.
          </p>
        </div>
        <span
          className="pill text-[10px]"
          style={{
            borderColor: "rgba(201, 163, 107, 0.45)",
            background: "rgba(245, 158, 46, 0.10)",
            color: "#F4EFE7",
            whiteSpace: "nowrap",
          }}
        >
          🎙 {audioError ? "Audio unavailable" : "Audio overview"}
        </span>
      </div>

      {/* Player */}
      <div
        className="mt-4 surface-elevated"
        style={{
          padding: 14,
          borderRadius: 12,
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <button
          onClick={togglePlay}
          disabled={audioError}
          aria-label={playing ? "Pause audio overview" : "Play audio overview"}
          aria-pressed={playing}
          title={
            audioError
              ? "Audio file not available — drop it at /public/audio/trustguard-overview.m4a"
              : playing
                ? "Pause"
                : "Play audio overview"
          }
          style={{
            width: 44,
            height: 44,
            borderRadius: 999,
            border: "1px solid rgba(245, 158, 46, 0.55)",
            background:
              "linear-gradient(135deg, rgba(245, 158, 46, 0.28), rgba(201, 163, 107, 0.22))",
            color: "#F4EFE7",
            fontSize: 16,
            cursor: audioError ? "not-allowed" : "pointer",
            opacity: audioError ? 0.55 : 1,
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {playing ? "❚❚" : "▶"}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="text-[13px] text-[var(--ink-0)] font-medium truncate"
            title="TrustGuard · Product walkthrough"
          >
            TrustGuard · Product walkthrough
          </div>

          {/* Waveform / scrubber */}
          <div
            ref={waveRef}
            onClick={seekTo}
            role="slider"
            aria-label="Audio progress"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
            tabIndex={0}
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "center",
              gap: 2,
              height: 22,
              cursor: audioError ? "default" : "pointer",
            }}
          >
            {WAVE_HEIGHTS.map((h, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  width: 3,
                  height: `${h}%`,
                  background:
                    i < progressBarIdx
                      ? "linear-gradient(180deg, #F59E2E, #C9A36B)"
                      : "rgba(184, 176, 163, 0.28)",
                  borderRadius: 2,
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-[var(--ink-2)]">
              {formatTime(current)}
            </span>
            <span className="text-[11px] text-[var(--ink-2)]">
              {AUDIO_DURATION_LABEL}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
        <p className="text-[11px] text-[var(--ink-2)] leading-relaxed max-w-xl">
          {audioError ? (
            <>
              ⚠ Audio file missing. Drop the source file at{" "}
              <code
                style={{
                  color: "var(--ink-1)",
                  background: "rgba(255,255,255,0.04)",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 10,
                }}
              >
                /public{AUDIO_OVERVIEW_SRC}
              </code>{" "}
              to enable playback. The rest of the app is unaffected.
            </>
          ) : (
            <>
              ⓘ 6:12 product overview, served as a static asset from{" "}
              <code
                style={{
                  color: "var(--ink-1)",
                  background: "rgba(255,255,255,0.04)",
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 10,
                }}
              >
                {AUDIO_OVERVIEW_SRC}
              </code>
              . No external audio services are called.
            </>
          )}
        </p>
        <button
          onClick={() => setTranscriptOpen((v) => !v)}
          className="pill text-[11px]"
          style={{
            borderColor: "rgba(201, 163, 107, 0.45)",
            color: "#F4EFE7",
          }}
          aria-expanded={transcriptOpen}
        >
          {transcriptOpen ? "Hide transcript" : "View transcript"}
        </button>
      </div>

      {transcriptOpen && (
        <div
          className="mt-3 p-3 rounded-lg border text-xs leading-relaxed text-[var(--ink-1)]"
          style={{
            borderColor: "var(--border)",
            background: "rgba(245, 158, 46, 0.05)",
          }}
        >
          <div className="text-[10px] uppercase tracking-widest text-[var(--ink-2)] mb-1.5">
            Transcript · placeholder
          </div>
          {TRANSCRIPT_PLACEHOLDER}
        </div>
      )}
    </section>
  );
}

const WAVE_HEIGHTS = [
  30, 55, 40, 70, 50, 85, 35, 60, 45, 75, 40, 65, 30, 55, 42, 68, 38, 58, 48, 72,
  35, 60, 40, 66, 30, 52, 44, 70, 36, 58, 42, 64, 32, 56, 46, 70, 38, 60, 30, 54,
  44, 66, 36, 58, 30, 50, 42, 64, 34, 56,
];
