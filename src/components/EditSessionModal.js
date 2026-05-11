import { useState } from "react";

function parseDetail(detail) {
  const m = detail.match(/(\d+(?:[.,]\d+)?)\s*min\s*corsa\s*\+\s*(\d+(?:[.,]\d+)?)\s*min\s*cammino\s*[×x]\s*(\d+)/i);
  if (m) return {
    type: "interval",
    runMin: m[1].replace(",", "."),
    walkMin: m[2].replace(",", "."),
    rounds: m[3],
  };
  const cm = detail.match(/^(\d+(?:[.,]\d+)?)\s*min/);
  if (cm) return { type: "continuous", totalMin: cm[1].replace(",", ".") };
  return { type: "continuous", totalMin: "20" };
}

export default function EditSessionModal({ session, onSave, onCancel }) {
  const parsed = parseDetail(session.detail);
  const [type, setType] = useState(parsed.type);
  const [runMin, setRunMin] = useState(parsed.runMin ?? "1");
  const [walkMin, setWalkMin] = useState(parsed.walkMin ?? "1");
  const [rounds, setRounds] = useState(parsed.rounds ?? "8");
  const [totalMin, setTotalMin] = useState(parsed.totalMin ?? "20");

  const handleSave = () => {
    const detail = type === "interval"
      ? `${runMin} min corsa + ${walkMin} min cammino × ${rounds}`
      : `${totalMin} min`;
    const label = type === "interval" ? "Corsa/cammino" : "Corsa continua";
    onSave({ label, detail });
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", border: "2px solid var(--clr-border)",
    borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
    fontSize: ".9rem", color: "var(--clr-text-dark)", background: "var(--bg-input)",
    boxSizing: "border-box", outline: "none",
  };

  const labelStyle = {
    fontSize: ".72rem", fontWeight: 700, color: "var(--clr-text-mid)",
    textTransform: "uppercase", letterSpacing: ".05em",
    marginBottom: 5, display: "block",
  };

  const preview = type === "interval"
    ? `${runMin} min corsa + ${walkMin} min cammino × ${rounds}`
    : `${totalMin} min`;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(42,31,26,.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onCancel}
    >
      <div
        style={{ background: "var(--bg-card)", borderRadius: 18, padding: "24px 20px", width: "100%", maxWidth: 340, boxShadow: "0 8px 32px rgba(42,31,26,.18)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--clr-text-dark)", marginBottom: 18 }}>
          Modifica sessione
        </div>

        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle}>Tipo di sessione</span>
          <div style={{ display: "flex", gap: 8 }}>
            {[["interval", "Corsa/cammino"], ["continuous", "Corsa continua"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setType(val)} style={{
                flex: 1, padding: "9px 0", borderRadius: 9,
                border: `2px solid ${type === val ? "#c4714a" : "var(--clr-border)"}`,
                background: type === val ? "rgba(196,113,74,.08)" : "var(--bg-input)",
                color: type === val ? "#c4714a" : "var(--clr-text-mid)",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: ".78rem", fontWeight: 700, cursor: "pointer",
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        {type === "interval" ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Corsa (min)</label>
                <input type="number" min="0.5" step="0.5" value={runMin} onChange={e => setRunMin(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Cammino (min)</label>
                <input type="number" min="0.5" step="0.5" value={walkMin} onChange={e => setWalkMin(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Ripetizioni</label>
              <input type="number" min="1" step="1" value={rounds} onChange={e => setRounds(e.target.value)} style={inputStyle} />
            </div>
          </>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Durata (minuti)</label>
            <input type="number" min="1" step="1" value={totalMin} onChange={e => setTotalMin(e.target.value)} style={inputStyle} />
          </div>
        )}

        <div style={{ background: "var(--bg-card-current)", borderRadius: 9, padding: "9px 12px", marginBottom: 18 }}>
          <span style={{ fontSize: ".72rem", fontWeight: 700, color: "#c4714a" }}>Anteprima: </span>
          <span style={{ fontSize: ".8rem", color: "var(--clr-text-mid)" }}>{preview}</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "11px 0", borderRadius: 10,
            border: "2px solid var(--clr-border)", background: "transparent",
            color: "var(--clr-text-mid)", fontFamily: "'DM Sans', sans-serif",
            fontSize: ".88rem", fontWeight: 600, cursor: "pointer",
          }}>Annulla</button>
          <button onClick={handleSave} style={{
            flex: 2, padding: "11px 0", borderRadius: 10,
            border: "none", background: "#c4714a", color: "#fff",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
          }}>Salva</button>
        </div>
      </div>
    </div>
  );
}
