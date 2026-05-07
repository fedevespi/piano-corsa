import { useState } from "react";
import { DAY_NAMES } from "../data/weekPlans";
import { getMondayOfCurrentWeek } from "../utils/schedule";

const MONTHS_IT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];

function getMondayOptions() {
  const current = getMondayOfCurrentWeek();
  return Array.from({ length: 9 }, (_, i) => {
    const d = new Date(current);
    d.setDate(d.getDate() + (i - 4) * 7);
    return d;
  });
}

function formatMondayOption(date, currentMonday) {
  const d = date.getDate();
  const m = MONTHS_IT[date.getMonth()];
  const y = date.getFullYear();
  const diff = Math.round((date - currentMonday) / (7 * 24 * 60 * 60 * 1000));
  const base = `lun ${d} ${m} ${y}`;
  if (diff === 0) return `${base} — questa settimana`;
  if (diff === 1) return `${base} — settimana prossima`;
  if (diff === -1) return `${base} — scorsa settimana`;
  if (diff > 1) return `${base} — tra ${diff} settimane`;
  return `${base} — ${Math.abs(diff)} settimane fa`;
}

export default function SetupScreen({ onGenerate }) {
  const [selected, setSelected] = useState(new Set());
  const currentMonday = getMondayOfCurrentWeek();
  const mondayOptions = getMondayOptions();
  const [startDate, setStartDate] = useState(currentMonday);

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

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, marginBottom: 4 }}>Da quando inizia la settimana 1?</div>
          <div style={{ fontSize: ".83rem", color: "#6b5347", marginBottom: 10 }}>Usato per sapere in quale settimana sei — puoi scegliere anche il passato o il futuro</div>
          <select
            value={startDate.toISOString()}
            onChange={e => setStartDate(new Date(e.target.value))}
            style={{
              width: "100%", padding: "13px 14px", border: "2px solid #e8ddd0",
              borderRadius: 12, background: "#fff", fontFamily: "'DM Sans', sans-serif",
              fontSize: ".88rem", color: "#2a1f1a", cursor: "pointer",
              appearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b5347' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
            }}
          >
            {mondayOptions.map(d => (
              <option key={d.toISOString()} value={d.toISOString()}>
                {formatMondayOption(d, currentMonday)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: 18, borderLeft: "4px solid #c4714a" }}>
          <p style={{ fontSize: ".83rem", color: "#6b5347", lineHeight: 1.6 }}>
            Metodo <strong style={{ color: "#2a1f1a" }}>corsa/camminata</strong> progressivo · 8 settimane.
            Potrai <strong style={{ color: "#2a1f1a" }}>modificare ogni settimana</strong> — tennis, giorni di corsa, tutto.
            Il piano viene <strong style={{ color: "#2a1f1a" }}>salvato automaticamente</strong> sul tuo browser. 💾
          </p>
        </div>

        <button disabled={selected.size === 0} onClick={() => onGenerate(selected, startDate)} style={{
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
