import { useState, useEffect, useRef } from "react";
 
const DAY_NAMES = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
 
const WEEK_PLANS = [
  { goal: "Inizia con calma", sessions: [
    { label: "Corsa/cammino", detail: "1 min corsa + 2 min cammino × 6 (18 min)" },
    { label: "Corsa/cammino", detail: "1 min corsa + 2 min cammino × 7 (21 min)" },
    { label: "Corsa/cammino", detail: "1 min corsa + 2 min cammino × 6 (18 min)" },
  ]},
  { goal: "Aumenta la corsa", sessions: [
    { label: "Corsa/cammino", detail: "2 min corsa + 1 min cammino × 6 (18 min)" },
    { label: "Corsa/cammino", detail: "2 min corsa + 1 min cammino × 7 (21 min)" },
    { label: "Corsa/cammino", detail: "2 min corsa + 1 min cammino × 6 (18 min)" },
  ]},
  { goal: "Blocchi più lunghi", sessions: [
    { label: "Corsa/cammino", detail: "3 min corsa + 1 min cammino × 5 (20 min)" },
    { label: "Corsa/cammino", detail: "5 min corsa + 2 min cammino × 3 (21 min)" },
    { label: "Corsa/cammino", detail: "3 min corsa + 1 min cammino × 5 (20 min)" },
  ]},
  { goal: "Meno pause", sessions: [
    { label: "Corsa/cammino", detail: "8 min corsa + 2 min cammino × 2 (20 min)" },
    { label: "Corsa continua", detail: "12 min corsa continua" },
    { label: "Corsa/cammino", detail: "8 min corsa + 2 min cammino × 2 (20 min)" },
  ]},
  { goal: "Prima corsa continua", sessions: [
    { label: "Corsa continua", detail: "15 min corsa continua" },
    { label: "Corsa continua", detail: "18 min corsa continua" },
    { label: "Corsa continua", detail: "15 min corsa continua" },
  ]},
  { goal: "Resistenza", sessions: [
    { label: "Corsa continua", detail: "20 min corsa continua" },
    { label: "Corsa continua", detail: "23 min corsa continua" },
    { label: "Corsa continua", detail: "20 min corsa continua" },
  ]},
  { goal: "Avvicinati ai 5km", sessions: [
    { label: "Corsa continua", detail: "25 min (~3 km)" },
    { label: "Corsa continua", detail: "28 min (~3.5 km)" },
    { label: "Corsa continua", detail: "25 min (~3 km)" },
  ]},
  { goal: "🎉 5km!", sessions: [
    { label: "Corsa continua", detail: "30 min (~3.8 km)" },
    { label: "5KM!", detail: "Corri 5km senza fermarti 🎉" },
    { label: "Corsa continua", detail: "30 min (~3.8 km)" },
  ]},
];
 
function getAvailableRunDays(tDays) {
  const forbidden = new Set(tDays);
  tDays.forEach(d => forbidden.add((d + 1) % 7));
  return ALL_DAYS.filter(d => !forbidden.has(d));
}
 
function buildInitialSchedule(tDays, sessions) {
  const runCandidates = getAvailableRunDays(tDays);
  const maxRun = Math.min(runCandidates.length, sessions.length);
  let runDays = [];
  if (maxRun > 0) {
    const step = runCandidates.length / maxRun;
    for (let i = 0; i < maxRun; i++) runDays.push(runCandidates[Math.floor(i * step + step / 2)]);
  }
  runDays = [...new Set(runDays)].sort((a, b) => a - b);
  let sIdx = 0;
  return ALL_DAYS.map(d => {
    if (tDays.includes(d)) return { day: d, type: "tennis", sessionIdx: null, done: false };
    if (runDays.includes(d) && sIdx < sessions.length) return { day: d, type: "run", sessionIdx: sIdx++, done: false };
    return { day: d, type: "rest", sessionIdx: null, done: false };
  });
}
 
// ── localStorage helpers ──────────────────────────────────────
const STORAGE_KEY = "piano-corsa-v1";
 
function saveToStorage(data) {
  try {
    // Convert Sets to arrays for JSON serialization
    const serializable = {
      defaultTennis: Array.from(data.defaultTennis),
      weekTennis: data.weekTennis.map(s => Array.from(s)),
      weekSchedules: data.weekSchedules,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (e) {}
}
 
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      defaultTennis: new Set(parsed.defaultTennis),
      weekTennis: parsed.weekTennis.map(a => new Set(a)),
      weekSchedules: parsed.weekSchedules,
    };
  } catch (e) { return null; }
}
 
// ── Session timer helpers ─────────────────────────────────────

function parseSession(detail) {
  const m = detail.match(/(\d+)\s*min\s*corsa\s*\+\s*(\d+)\s*min\s*cammino\s*[×x]\s*(\d+)/i);
  if (m) {
    const runSec = parseInt(m[1]) * 60;
    const walkSec = parseInt(m[2]) * 60;
    const rounds = parseInt(m[3]);
    return { type: "interval", runSec, walkSec, rounds, totalSec: (runSec + walkSec) * rounds };
  }
  const cm = detail.match(/^(\d+)\s*min/);
  if (cm) return { type: "continuous", totalSec: parseInt(cm[1]) * 60 };
  return { type: "open" };
}

function derivePhase(session, elapsedSec) {
  if (session.type === "interval") {
    const { runSec, walkSec, rounds } = session;
    const cycleSec = runSec + walkSec;
    if (elapsedSec >= session.totalSec) return { phase: "done", remaining: 0, round: rounds, rounds };
    const round = Math.floor(elapsedSec / cycleSec);
    const inCycle = elapsedSec % cycleSec;
    return inCycle < runSec
      ? { phase: "run", remaining: runSec - inCycle, round: round + 1, rounds }
      : { phase: "walk", remaining: cycleSec - inCycle, round: round + 1, rounds };
  }
  if (session.type === "continuous") {
    const remaining = Math.max(0, session.totalSec - elapsedSec);
    return remaining === 0 ? { phase: "done", remaining: 0 } : { phase: "run", remaining };
  }
  return { phase: "run", remaining: null };
}

function scheduleBeep(actx, freq, time, dur = 0.35) {
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.connect(gain);
  gain.connect(actx.destination);
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.8, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
  osc.start(time);
  osc.stop(time + dur + 0.05);
}

function scheduleAllBeeps(actx, session) {
  const t0 = actx.currentTime + 0.15;
  if (session.type === "interval") {
    const { runSec, walkSec, rounds } = session;
    const cycleSec = runSec + walkSec;
    scheduleBeep(actx, 880, t0);
    for (let r = 0; r < rounds; r++) {
      const base = t0 + r * cycleSec;
      scheduleBeep(actx, 550, base + runSec);
      scheduleBeep(actx, 550, base + runSec + 0.4);
      if (r < rounds - 1) scheduleBeep(actx, 880, base + cycleSec);
    }
  } else if (session.type === "continuous") {
    scheduleBeep(actx, 880, t0);
  } else {
    scheduleBeep(actx, 880, t0);
  }
  if (session.totalSec) {
    const td = t0 + session.totalSec;
    scheduleBeep(actx, 660, td);
    scheduleBeep(actx, 770, td + 0.35);
    scheduleBeep(actx, 990, td + 0.7);
  }
}

function startKeepAlive(actx) {
  const buf = actx.createBuffer(1, 1, 22050);
  const fire = () => {
    try {
      const src = actx.createBufferSource();
      src.buffer = buf;
      src.connect(actx.destination);
      src.start(0);
    } catch (_) {}
  };
  fire();
  return setInterval(fire, 20000);
}

// ── Timer overlay ─────────────────────────────────────────────

function TimerOverlay({ label, session, onStop, onMarkDone }) {
  const [elapsed, setElapsed] = useState(0);
  const startMs = useRef(Date.now());
  const doneFired = useRef(false);
  const onMarkDoneRef = useRef(onMarkDone);
  onMarkDoneRef.current = onMarkDone;

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!doneFired.current && session.totalSec && elapsed >= session.totalSec) {
      doneFired.current = true;
      onMarkDoneRef.current();
    }
  }, [elapsed, session.totalSec]);

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

// ── Setup ─────────────────────────────────────────────────────
function SetupScreen({ onGenerate }) {
  const [selected, setSelected] = useState(new Set());
  const toggle = (d) => setSelected(prev => {
    const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n;
  });
 
  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#2a1f1a", color: "#f5f0e8", padding: "44px 24px 36px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "#c4714a", opacity: .15 }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 140, height: 140, borderRadius: "50%", background: "#7ab648", opacity: .1 }} />
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 900, lineHeight: 1.1, position: "relative" }}>
          Il tuo piano<br /><span style={{ color: "#e8956d" }}>corsa + tennis</span>
        </h1>
        <p style={{ fontSize: ".88rem", opacity: .7, marginTop: 10, position: "relative" }}>Da 0 a 5km · 8 settimane · personalizzato</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, flexWrap: "wrap" }}>
          {[["🎾 Tennis", "#7ab648"], ["👟 Corsa", "#c4714a"], ["😴 Riposo", "#6b5347"]].map(([t, bg]) => (
            <span key={t} style={{ background: bg, color: "#fff", padding: "5px 13px", borderRadius: 20, fontSize: ".74rem", fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      </div>
 
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: 4 }}>Quando fai tennis?</div>
        <div style={{ fontSize: ".83rem", color: "#6b5347", marginBottom: 20 }}>Seleziona i giorni tipici — potrai cambiarli settimana per settimana</div>
 
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 22 }}>
          {DAY_NAMES.map((name, i) => {
            const on = selected.has(i);
            return (
              <button key={i} onClick={() => toggle(i)} style={{
                aspectRatio: "1", borderRadius: 10, border: `2px solid ${on ? "#5a8f30" : "#e8ddd0"}`,
                background: on ? "#7ab648" : "#fff", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: 0
              }}>
                <span style={{ fontSize: "1.1rem" }}>{on ? "🎾" : "☀️"}</span>
                <span style={{ fontSize: ".57rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: on ? "rgba(255,255,255,.9)" : "#6b5347" }}>{name}</span>
              </button>
            );
          })}
        </div>
 
        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 18, borderLeft: "4px solid #c4714a" }}>
          <p style={{ fontSize: ".83rem", color: "#6b5347", lineHeight: 1.6 }}>
            Metodo <strong style={{ color: "#2a1f1a" }}>corsa/camminata</strong> progressivo · 8 settimane.
            Potrai <strong style={{ color: "#2a1f1a" }}>modificare ogni settimana</strong> — tennis, giorni di corsa, tutto.
            Il piano viene <strong style={{ color: "#2a1f1a" }}>salvato automaticamente</strong> sul tuo browser. 💾
          </p>
        </div>
 
        <button disabled={selected.size === 0} onClick={() => onGenerate(selected)} style={{
          width: "100%", padding: "17px", border: "none", borderRadius: 14,
          background: selected.size === 0 ? "#e8ddd0" : "#c4714a",
          color: selected.size === 0 ? "#6b5347" : "#fff",
          fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700,
          cursor: selected.size === 0 ? "not-allowed" : "pointer"
        }}>
          {selected.size === 0 ? "Seleziona almeno 1 giorno" : "Genera il piano →"}
        </button>
      </div>
    </div>
  );
}
 
// ── Week card ─────────────────────────────────────────────────
function WeekCard({ weekIdx, week, tennisDays, schedule, onToggleTennis, onUpdateSchedule, onToggleDone, onStartTimer }) {
  const tArr = Array.from(tennisDays).sort((a, b) => a - b);
  const assignedIdxs = schedule.filter(s => s.type === "run").map(s => s.sessionIdx);
  const runCount = assignedIdxs.length;
  const maxRun = Math.min(getAvailableRunDays(tArr).length, week.sessions.length);
  const nextFree = runCount < week.sessions.length
    ? [...Array(week.sessions.length).keys()].find(i => !assignedIdxs.includes(i))
    : null;
  const pct = Math.round(((weekIdx + 1) / 8) * 100);
  const sorted = [...schedule].sort((a, b) => a.day - b.day);
 
  const styles = {
    tennis: { dot: "rgba(122,182,72,.15)", tagBg: "#7ab648", tagColor: "#fff", emoji: "🎾", tagLabel: "tennis" },
    run:    { dot: "rgba(196,113,74,.15)", tagBg: "#c4714a", tagColor: "#fff", emoji: "👟", tagLabel: "corsa" },
    rest:   { dot: "rgba(176,160,144,.15)", tagBg: "#e8ddd0", tagColor: "#6b5347", emoji: "😴", tagLabel: "riposo" },
  };
 
  const handleTap = (day) => {
    const entry = schedule.find(s => s.day === day);
    if (!entry || entry.type === "tennis") return;
    let newSchedule;
    if (entry.type === "run") {
      newSchedule = schedule.map(s => s.day === day ? { ...s, type: "rest", sessionIdx: null } : s);
    } else {
      if (nextFree === null) return;
      newSchedule = schedule.map(s => s.day === day ? { ...s, type: "run", sessionIdx: nextFree } : s);
    }
    onUpdateSchedule(weekIdx, newSchedule);
  };
 
  return (
    <div style={{ background: "#fff", borderRadius: 16, margin: "0 16px 16px", overflow: "hidden", boxShadow: "0 2px 14px rgba(42,31,26,.08)" }}>
      <div style={{ padding: "12px 16px", background: "#e8ddd0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: ".95rem", fontWeight: 700 }}>Settimana {weekIdx + 1}</span>
        <span style={{ fontSize: ".7rem", color: "#c4714a", fontWeight: 700, background: "rgba(196,113,74,.12)", padding: "3px 9px", borderRadius: 9 }}>{week.goal}</span>
      </div>
 
      <div style={{ height: 5, background: "#e8ddd0" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#c4714a,#f0c080)" }} />
      </div>
 
      <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #f5f0e8" }}>
        <div style={{ fontSize: ".75rem", color: "#6b5347", fontWeight: 600, marginBottom: 8 }}>🎾 Tennis questa settimana:</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          {DAY_NAMES.map((name, di) => {
            const on = tennisDays.has(di);
            return (
              <button key={di} onClick={() => onToggleTennis(weekIdx, di)} style={{
                width: 40, height: 36, borderRadius: 8,
                border: `2px solid ${on ? "#5a8f30" : "#e8ddd0"}`,
                background: on ? "#7ab648" : "#faf8f5",
                color: on ? "#fff" : "#6b5347",
                fontSize: ".65rem", fontWeight: 700, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: ".03em"
              }}>{name.slice(0, 2)}</button>
            );
          })}
        </div>
        <div style={{ fontSize: ".74rem", color: "#6b5347" }}>
          Tennis {tArr.length}× → <strong style={{ color: "#c4714a" }}>{runCount} / {maxRun} sessioni di corsa</strong>
          {nextFree !== null && <span style={{ color: "#7ab648" }}> · tocca 😴 per aggiungerne</span>}
        </div>
      </div>
 
      <div style={{ padding: "7px 16px", background: "#fffcf8", borderBottom: "1px solid #f5f0e8" }}>
        <span style={{ fontSize: ".72rem", color: "#9b7b6a" }}>
          Tocca <strong>👟</strong> per liberare · Tocca <strong>😴</strong> per mettere la corsa lì
        </span>
      </div>
 
      {sorted.map(({ day, type, sessionIdx: sIdx, done }) => {
        const st = styles[type];
        const sessionInfo = type === "run" && sIdx !== null ? week.sessions[sIdx] : null;
        const label = sessionInfo ? sessionInfo.label : type === "tennis" ? "Tennis" : "Riposo";
        const detail = sessionInfo ? sessionInfo.detail : type === "tennis" ? "Allenamento normale" : "Recupero o stretching";
        const canTap = type === "run" || (type === "rest" && nextFree !== null);
        const hint = "";
        const rowBg = done ? "rgba(122,182,72,.07)" : "transparent";
 
        return (
          <div key={day} onClick={() => handleTap(day)}
            onTouchStart={e => { if (canTap) e.currentTarget.style.background = done ? "rgba(122,182,72,.12)" : "#fff8f5"; }}
            onTouchEnd={e => { e.currentTarget.style.background = rowBg; }}
            onMouseEnter={e => { if (canTap) e.currentTarget.style.background = done ? "rgba(122,182,72,.12)" : "#fff8f5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
            style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f5f0e8", gap: 12, cursor: canTap ? "pointer" : "default", background: rowBg, transition: "background .15s" }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: st.dot, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0, opacity: done ? .55 : 1 }}>{st.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#6b5347", textTransform: "uppercase", letterSpacing: ".06em" }}>{DAY_NAMES[day]}</div>
              <div style={{ fontSize: ".88rem", fontWeight: 600, color: done ? "#9b7b6a" : "#2a1f1a", marginTop: 1, textDecoration: done ? "line-through" : "none" }}>{label}</div>
              <div style={{ fontSize: ".75rem", color: "#6b5347", marginTop: 2, opacity: done ? .65 : 1 }}>{detail}</div>
            </div>
            {type === "run" && (
              <button
                onClick={e => { e.stopPropagation(); onStartTimer(weekIdx, day, { label, detail }); }}
                title="Avvia cronometro"
                style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  border: "2px solid #c4714a", background: "transparent",
                  color: "#c4714a", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: ".85rem", transition: "all .15s", paddingLeft: "10px",paddingBottom: "3.5px",
                }}
              >
                ▶
              </button>
            )}
            {type === "run" && (
              <button
                onClick={e => { e.stopPropagation(); onToggleDone(weekIdx, day); }}
                title={done ? "Segna come da fare" : "Segna come fatto"}
                style={{
                  width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                  border: `2px solid ${done ? "#7ab648" : "#d0c4b8"}`,
                  background: done ? "#7ab648" : "transparent",
                  color: done ? "#fff" : "#b0a090",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", fontWeight: 700, lineHeight: 1, transition: "all .15s",
                }}
              >
                ✓
              </button>
            )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: ".67rem", fontWeight: 700, padding: "3px 9px", borderRadius: 7, background: st.tagBg, color: st.tagColor, textTransform: "uppercase", letterSpacing: ".04em", opacity: done ? .6 : 1 }}>{st.tagLabel}</span>
              {hint && <span style={{ fontSize: ".6rem", color: "#b0a090" }}>{hint}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
 
// ── Plan ──────────────────────────────────────────────────────
function PlanScreen({ defaultTennis, weekTennis, weekSchedules, onToggleTennis, onUpdateSchedule, onToggleDone, onStartTimer, onReset }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#2a1f1a", color: "#f5f0e8", padding: "22px 20px 18px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 900 }}>Il tuo piano 🎾👟</h2>
      </div>
 
      <div style={{ display: "flex", gap: 14, justifyContent: "center", padding: "14px 20px", flexWrap: "wrap" }}>
        {[["#c4714a", "Corsa"], ["#7ab648", "Tennis"], ["#b0a090", "Riposo"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".76rem", color: "#6b5347" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />{l}
          </div>
        ))}
      </div>
 
      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        {WEEK_PLANS.map((week, wi) => (
          <WeekCard
            key={wi}
            weekIdx={wi}
            week={week}
            tennisDays={weekTennis[wi]}
            schedule={weekSchedules[wi]}
            onToggleTennis={onToggleTennis}
            onUpdateSchedule={onUpdateSchedule}
            onToggleDone={onToggleDone}
            onStartTimer={onStartTimer}
          />
        ))}
 
        <div style={{ margin: "0 16px 16px", background: "rgba(196,113,74,.07)", border: "1px solid rgba(196,113,74,.2)", borderRadius: 13, padding: "14px 16px" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: ".9rem", color: "#c4714a", marginBottom: 8 }}>💡 Consigli utili</h3>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {["Tocca i giorni 🎾 per cambiare il tennis della settimana","Tocca 👟 per liberare quel giorno","Tocca 😴 per spostare lì la corsa","Non correre il giorno dopo il tennis","La velocità non conta — completa il tempo"].map((t, i) => (
              <li key={i} style={{ fontSize: ".8rem", color: "#6b5347", paddingLeft: 16, position: "relative", lineHeight: 1.4 }}>
                <span style={{ position: "absolute", left: 0, color: "#c4714a" }}>→</span>{t}
              </li>
            ))}
          </ul>
        </div>
 
        <button onClick={onReset} style={{ display: "block", margin: "0 16px 32px", width: "calc(100% - 32px)", padding: 13, background: "transparent", border: "2px solid #e8ddd0", borderRadius: 11, fontFamily: "'DM Sans', sans-serif", fontSize: ".88rem", color: "#6b5347", cursor: "pointer" }}>
          ← Ricomincia da capo
        </button>
      </div>
    </div>
  );
}
 
// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [activeTimer, setActiveTimer] = useState(null);
  const audioCtxRef = useRef(null);
  const keepAliveRef = useRef(null);

  const [state, setState] = useState(() => {
    // Try to load from localStorage on first render
    const saved = loadFromStorage();
    if (saved) return { screen: "plan", ...saved };
    return { screen: "setup", defaultTennis: new Set(), weekTennis: [], weekSchedules: [] };
  });
 
  // Save to localStorage whenever plan state changes
  useEffect(() => {
    if (state.screen === "plan") {
      saveToStorage({
        defaultTennis: state.defaultTennis,
        weekTennis: state.weekTennis,
        weekSchedules: state.weekSchedules,
      });
    }
  }, [state]);
 
  const handleGenerate = (selected) => {
    const defaultTennis = selected;
    const tArr = Array.from(selected).sort((a, b) => a - b);
    const weekTennis = WEEK_PLANS.map(() => new Set(selected));
    const weekSchedules = WEEK_PLANS.map(w => buildInitialSchedule(tArr, w.sessions));
    const newState = { screen: "plan", defaultTennis, weekTennis, weekSchedules };
    setState(newState);
  };
 
  const handleToggleTennis = (wi, di) => {
    setState(prev => {
      const weekTennis = prev.weekTennis.map(s => new Set(s));
      weekTennis[wi].has(di) ? weekTennis[wi].delete(di) : weekTennis[wi].add(di);
      // Rebuild schedule for this week when tennis changes
      const tArr = Array.from(weekTennis[wi]).sort((a, b) => a - b);
      const weekSchedules = [...prev.weekSchedules];
      weekSchedules[wi] = buildInitialSchedule(tArr, WEEK_PLANS[wi].sessions);
      return { ...prev, weekTennis, weekSchedules };
    });
  };
 
  const handleUpdateSchedule = (wi, newSchedule) => {
    setState(prev => {
      const weekSchedules = [...prev.weekSchedules];
      weekSchedules[wi] = newSchedule;
      return { ...prev, weekSchedules };
    });
  };
 
  const handleToggleDone = (wi, day) => {
    setState(prev => {
      const weekSchedules = [...prev.weekSchedules];
      weekSchedules[wi] = weekSchedules[wi].map(s =>
        s.day === day ? { ...s, done: !s.done } : s
      );
      return { ...prev, weekSchedules };
    });
  };

  const stopAudio = () => {
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    if (keepAliveRef.current) { clearInterval(keepAliveRef.current); keepAliveRef.current = null; }
  };

  const handleStartTimer = (wi, day, sessionInfo) => {
    stopAudio();
    const session = parseSession(sessionInfo.detail);
    try {
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = actx;
      actx.resume().then(() => {
        scheduleAllBeeps(actx, session);
        keepAliveRef.current = startKeepAlive(actx);
      });
    } catch (_) {}
    setActiveTimer({ wi, day, label: sessionInfo.label, session });
  };

  const handleStopTimer = () => {
    stopAudio();
    setActiveTimer(null);
  };

  const handleTimerMarkDone = () => {
    if (activeTimer) handleToggleDone(activeTimer.wi, activeTimer.day);
    setTimeout(() => { stopAudio(); setActiveTimer(null); }, 3000);
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ screen: "setup", defaultTennis: new Set(), weekTennis: [], weekSchedules: [] });
  };
 
  if (state.screen === "setup") return <SetupScreen onGenerate={handleGenerate} />;
  return (
    <>
      <PlanScreen
        defaultTennis={state.defaultTennis}
        weekTennis={state.weekTennis}
        weekSchedules={state.weekSchedules}
        onToggleTennis={handleToggleTennis}
        onUpdateSchedule={handleUpdateSchedule}
        onToggleDone={handleToggleDone}
        onStartTimer={handleStartTimer}
        onReset={handleReset}
      />
      {activeTimer && (
        <TimerOverlay
          label={activeTimer.label}
          session={activeTimer.session}
          onStop={handleStopTimer}
          onMarkDone={handleTimerMarkDone}
        />
      )}
    </>
  );
}