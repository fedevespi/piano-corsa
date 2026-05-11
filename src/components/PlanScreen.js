import { useState, useRef, useEffect } from "react";
import { getCurrentWeekIdx } from "../utils/schedule";
import WeekCard from "./WeekCard";

export default function PlanScreen({ weekPlans, weekTennis, weekSchedules, planStartDate, onToggleTennis, onUpdateSchedule, onToggleDone, onStartTimer, onRepeatWeek, onEditSession, onReset, darkMode, onToggleDark }) {
  const currentWeekIdx = getCurrentWeekIdx(planStartDate);
  const [openIdx, setOpenIdx] = useState(currentWeekIdx);
  const currentRef = useRef(null);

  useEffect(() => {
    const el = currentRef.current;
    if (!el) return;
    const timer = setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "var(--bg-header)", color: "var(--clr-text-header)", padding: "22px 20px 18px", textAlign: "center", position: "relative" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 900 }}>Il tuo piano 🎾👟</h2>
        <button onClick={onToggleDark} title={darkMode ? "Modalità chiara" : "Modalità scura"} style={{ position: "absolute", top: 14, right: 16, background: "rgba(255,255,255,.12)", border: "none", borderRadius: 20, padding: "6px 12px", fontSize: "1rem", cursor: "pointer" }}>
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 14, justifyContent: "center", padding: "14px 20px", flexWrap: "wrap" }}>
        {[["#c4714a", "Corsa"], ["#7ab648", "Tennis"], ["#b0a090", "Riposo"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: ".76rem", color: "var(--clr-text-mid)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />{l}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto" }}>
        {weekPlans.map((week, wi) => (
          <WeekCard
            key={wi}
            weekIdx={wi}
            week={week}
            totalWeeks={weekPlans.length}
            tennisDays={weekTennis[wi]}
            schedule={weekSchedules[wi]}
            isCurrent={wi === currentWeekIdx}
            isOpen={wi === openIdx}
            onToggle={() => setOpenIdx(prev => prev === wi ? -1 : wi)}
            scrollRef={wi === currentWeekIdx ? currentRef : null}
            onToggleTennis={onToggleTennis}
            onUpdateSchedule={onUpdateSchedule}
            onToggleDone={onToggleDone}
            onStartTimer={onStartTimer}
            onRepeatWeek={onRepeatWeek}
            onEditSession={onEditSession}
          />
        ))}

        <div style={{ margin: "0 16px 16px", background: "rgba(196,113,74,.07)", border: "1px solid rgba(196,113,74,.2)", borderRadius: 13, padding: "14px 16px" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: ".9rem", color: "#c4714a", marginBottom: 8 }}>💡 Consigli utili</h3>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {["Tocca i giorni 🎾 per cambiare il tennis della settimana", "Tocca 👟 per liberare quel giorno", "Tocca 😴 per spostare lì la corsa", "Non correre il giorno dopo il tennis", "La velocità non conta — completa il tempo"].map((t, i) => (
              <li key={i} style={{ fontSize: ".8rem", color: "var(--clr-text-mid)", paddingLeft: 16, position: "relative", lineHeight: 1.4 }}>
                <span style={{ position: "absolute", left: 0, color: "#c4714a" }}>→</span>{t}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={onReset} style={{ display: "block", margin: "0 16px 32px", width: "calc(100% - 32px)", padding: 13, background: "transparent", border: "2px solid var(--clr-border)", borderRadius: 11, fontFamily: "'DM Sans', sans-serif", fontSize: ".88rem", color: "var(--clr-text-mid)", cursor: "pointer" }}>
          ← Ricomincia da capo
        </button>
      </div>
    </div>
  );
}
