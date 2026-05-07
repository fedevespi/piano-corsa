import { WEEK_PLANS } from "../data/weekPlans";
import WeekCard from "./WeekCard";

export default function PlanScreen({ weekTennis, weekSchedules, onToggleTennis, onUpdateSchedule, onToggleDone, onStartTimer, onReset }) {
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
            {["Tocca i giorni 🎾 per cambiare il tennis della settimana", "Tocca 👟 per liberare quel giorno", "Tocca 😴 per spostare lì la corsa", "Non correre il giorno dopo il tennis", "La velocità non conta — completa il tempo"].map((t, i) => (
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
