import { useState } from "react";
import { DAY_NAMES } from "../data/weekPlans";
import { getAvailableRunDays } from "../utils/schedule";
import EditSessionModal from "./EditSessionModal";

const DAY_STYLES = {
  tennis: { dot: "rgba(122,182,72,.15)", tagBg: "#7ab648", tagColor: "#fff", emoji: "🎾", tagLabel: "tennis" },
  run:    { dot: "rgba(196,113,74,.15)", tagBg: "#c4714a", tagColor: "#fff", emoji: "👟", tagLabel: "corsa" },
  rest:   { dot: "rgba(176,160,144,.15)", tagBg: "#e8ddd0", tagColor: "#6b5347", emoji: "😴", tagLabel: "riposo" },
};

export default function WeekCard({ weekIdx, week, totalWeeks, tennisDays, schedule, isCurrent, isOpen, onToggle, scrollRef, onToggleTennis, onUpdateSchedule, onToggleDone, onStartTimer, onRepeatWeek, onEditSession }) {
  const [editTarget, setEditTarget] = useState(null);
  const tArr = Array.from(tennisDays).sort((a, b) => a - b);
  const assignedIdxs = schedule.filter(s => s.type === "run").map(s => s.sessionIdx);
  const runCount = assignedIdxs.length;
  const maxRun = Math.min(getAvailableRunDays(tArr).length, week.sessions.length);
  const nextFree = runCount < week.sessions.length
    ? [...Array(week.sessions.length).keys()].find(i => !assignedIdxs.includes(i))
    : null;
  const pct = Math.round(((weekIdx + 1) / (totalWeeks ?? 8)) * 100);
  const sorted = [...schedule].sort((a, b) => a.day - b.day);

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
    <div ref={scrollRef} style={{ background: "#fff", borderRadius: 16, margin: "0 16px 10px", overflow: "hidden", boxShadow: isCurrent ? "0 2px 18px rgba(196,113,74,.22)" : "0 2px 14px rgba(42,31,26,.08)", border: isCurrent ? "2px solid #c4714a" : "2px solid transparent" }}>

      {/* ── Header (always visible, clickable) ── */}
      <div onClick={onToggle} style={{ padding: "13px 16px", background: isCurrent ? "#fdf5f0" : "#e8ddd0", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: ".95rem", fontWeight: 700, color: "#2a1f1a" }}>
          Settimana {weekIdx + 1}
        </span>
        {isCurrent && (
          <span style={{ fontSize: ".65rem", fontWeight: 700, background: "#c4714a", color: "#fff", padding: "2px 8px", borderRadius: 10, letterSpacing: ".03em" }}>
            Questa settimana
          </span>
        )}
        <span style={{ fontSize: ".7rem", color: "#c4714a", fontWeight: 700, background: "rgba(196,113,74,.12)", padding: "3px 9px", borderRadius: 9, marginLeft: "auto" }}>
          {week.goal}
        </span>
        <span style={{ fontSize: ".75rem", color: "#6b5347", marginLeft: 4, transition: "transform .2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
          ▼
        </span>
      </div>

      {/* ── Accordion body ── */}
      {isOpen && (
        <>
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
            const st = DAY_STYLES[type];
            const sessionInfo = type === "run" && sIdx !== null ? week.sessions[sIdx] : null;
            const label = sessionInfo ? sessionInfo.label : type === "tennis" ? "Tennis" : "Riposo";
            const detail = sessionInfo ? sessionInfo.detail : type === "tennis" ? "Allenamento normale" : "Recupero o stretching";
            const canTap = type === "run" || (type === "rest" && nextFree !== null);
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
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <span style={{ fontSize: ".75rem", color: "#6b5347", opacity: done ? .65 : 1 }}>{detail}</span>
                    {type === "run" && (
                      <button
                        onClick={e => { e.stopPropagation(); setEditTarget({ sessionIdx: sIdx }); }}
                        title="Modifica sessione"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: ".75rem", opacity: .45, lineHeight: 1, display: "flex", alignItems: "center" }}
                      >✏️</button>
                    )}
                  </div>
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
                      fontSize: ".85rem", transition: "all .15s", paddingLeft: "10px", paddingBottom: "3.5px",
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
                </div>
              </div>
            );
          })}
          {editTarget && (
            <EditSessionModal
              session={week.sessions[editTarget.sessionIdx]}
              onSave={updated => { onEditSession(weekIdx, editTarget.sessionIdx, updated); setEditTarget(null); }}
              onCancel={() => setEditTarget(null)}
            />
          )}

          <div style={{ padding: "12px 16px 14px" }}>
            <button
              onClick={() => onRepeatWeek(weekIdx)}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 10,
                border: "2px dashed #d0c4b8", background: "transparent",
                color: "#6b5347", fontFamily: "'DM Sans', sans-serif",
                fontSize: ".82rem", fontWeight: 600, cursor: "pointer",
                transition: "all .15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#c4714a"; e.currentTarget.style.color = "#c4714a"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#d0c4b8"; e.currentTarget.style.color = "#6b5347"; }}
            >
              ↩ Ripeti questa settimana
            </button>
          </div>
        </>
      )}
    </div>
  );
}
