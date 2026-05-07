import { useState, useEffect } from "react";
 
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
    if (tDays.includes(d)) return { day: d, type: "tennis", sessionIdx: null };
    if (runDays.includes(d) && sIdx < sessions.length) return { day: d, type: "run", sessionIdx: sIdx++ };
    return { day: d, type: "rest", sessionIdx: null };
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
          Il tuo piano<br /><span style={{ color: "#e8956d" }}>personalizzato</span>
        </h1>
        <p style={{ fontSize: ".88rem", opacity: .7, marginTop: 10, position: "relative" }}>Da 0 a 5km · 8 settimane</p>
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
function WeekCard({ weekIdx, week, tennisDays, schedule, onToggleTennis, onUpdateSchedule }) {
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
 
      {sorted.map(({ day, type, sessionIdx: sIdx }) => {
        const st = styles[type];
        const sessionInfo = type === "run" && sIdx !== null ? week.sessions[sIdx] : null;
        const label = sessionInfo ? sessionInfo.label : type === "tennis" ? "Tennis" : "Riposo";
        const detail = sessionInfo ? sessionInfo.detail : type === "tennis" ? "Allenamento normale" : "Recupero o stretching";
        const canTap = type === "run" || (type === "rest" && nextFree !== null);
        const hint = type === "run" ? "tocca per liberare" : canTap ? "tocca per aggiungere" : "";
 
        return (
          <div key={day} onClick={() => handleTap(day)}
            onTouchStart={e => { if (canTap) e.currentTarget.style.background = "#fff8f5"; }}
            onTouchEnd={e => { e.currentTarget.style.background = "transparent"; }}
            onMouseEnter={e => { if (canTap) e.currentTarget.style.background = "#fff8f5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f5f0e8", gap: 12, cursor: canTap ? "pointer" : "default" }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 10, background: st.dot, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>{st.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#6b5347", textTransform: "uppercase", letterSpacing: ".06em" }}>{DAY_NAMES[day]}</div>
              <div style={{ fontSize: ".88rem", fontWeight: 600, color: "#2a1f1a", marginTop: 1 }}>{label}</div>
              <div style={{ fontSize: ".75rem", color: "#6b5347", marginTop: 2 }}>{detail}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: ".67rem", fontWeight: 700, padding: "3px 9px", borderRadius: 7, background: st.tagBg, color: st.tagColor, textTransform: "uppercase", letterSpacing: ".04em" }}>{st.tagLabel}</span>
              {hint && <span style={{ fontSize: ".6rem", color: "#b0a090" }}>{hint}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
 
// ── Plan ──────────────────────────────────────────────────────
function PlanScreen({ defaultTennis, weekTennis, weekSchedules, onToggleTennis, onUpdateSchedule, onReset }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "#2a1f1a", color: "#f5f0e8", padding: "22px 20px 18px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 900 }}>Il tuo piano 🎾👟</h2>
        <p style={{ fontSize: ".8rem", opacity: .65, marginTop: 5 }}>Salvato automaticamente 💾</p>
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
 
  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ screen: "setup", defaultTennis: new Set(), weekTennis: [], weekSchedules: [] });
  };
 
  if (state.screen === "setup") return <SetupScreen onGenerate={handleGenerate} />;
  return (
    <PlanScreen
      defaultTennis={state.defaultTennis}
      weekTennis={state.weekTennis}
      weekSchedules={state.weekSchedules}
      onToggleTennis={handleToggleTennis}
      onUpdateSchedule={handleUpdateSchedule}
      onReset={handleReset}
    />
  );
}