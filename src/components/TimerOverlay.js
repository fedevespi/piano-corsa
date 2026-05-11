import { useState, useEffect, useRef } from "react";
import { derivePhase } from "../utils/timer";

export default function TimerOverlay({ label, session, onStop, onMarkDone }) {
  const [elapsed, setElapsed] = useState(0);
  const startMs = useRef(Date.now());
  const doneFired = useRef(false);
  const onMarkDoneRef = useRef(onMarkDone);
  onMarkDoneRef.current = onMarkDone;
  const prevPhaseRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs.current) / 1000));
    }, 500);
    navigator.vibrate?.([200]);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!doneFired.current && session.totalSec && elapsed >= session.totalSec) {
      doneFired.current = true;
      onMarkDoneRef.current();
    }
  }, [elapsed, session.totalSec]);

  useEffect(() => {
    const { phase } = derivePhase(session, elapsed);
    const prev = prevPhaseRef.current;
    if (prev !== null && phase !== prev) {
      if (phase === "done")       navigator.vibrate?.([200, 100, 200, 100, 400]);
      else if (phase === "run")   navigator.vibrate?.([300]);
      else if (phase === "walk")  navigator.vibrate?.([100, 50, 100]);
    }
    prevPhaseRef.current = phase;
  }, [elapsed, session]);

  const fmt = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;
  const { phase, remaining, round, rounds } = derivePhase(session, elapsed);
  const isDone = phase === "done";
  const bg = isDone ? "#7ab648" : phase === "run" ? "#c4714a" : "#2a7a8a";
  const pct = session.totalSec ? Math.min(100, (elapsed / session.totalSec) * 100) : null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000, background: bg, borderRadius: "20px 20px 0 0", padding: "20px 24px 36px", boxShadow: "0 -6px 32px rgba(0,0,0,.25)", fontFamily: "'DM Sans', sans-serif", transition: "background .4s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ color: "rgba(255,255,255,.75)", fontSize: ".78rem", fontWeight: 600 }}>
          {label}{session.type === "interval" && round ? ` · round ${round}/${rounds}` : ""}
        </span>
        <button onClick={onStop} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 20, color: "#fff", fontSize: ".78rem", fontWeight: 700, padding: "7px 16px", cursor: "pointer" }}>
          ✕ Stop
        </button>
      </div>

      <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>
          {isDone ? "🎉 Completata!" : phase === "run" ? "CORRI 🏃" : "CAMMINA 🚶"}
        </div>
        {!isDone && (
          <div style={{ fontSize: "3.5rem", fontWeight: 700, color: "rgba(255,255,255,.95)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
            {remaining != null ? fmt(remaining) : fmt(elapsed)}
          </div>
        )}
      </div>

      {pct !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.6)", minWidth: 34 }}>{fmt(elapsed)}</span>
          <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,.2)", borderRadius: 3 }}>
            <div style={{ height: "100%", borderRadius: 3, background: "rgba(255,255,255,.75)", width: `${pct}%`, transition: "width .5s linear" }} />
          </div>
          <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,.6)", minWidth: 34, textAlign: "right" }}>{fmt(session.totalSec)}</span>
        </div>
      )}
    </div>
  );
}
