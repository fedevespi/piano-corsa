export function parseSession(detail) {
  const m = detail.match(/(\d+(?:[.,]\d+)?)\s*min\s*corsa\s*\+\s*(\d+(?:[.,]\d+)?)\s*min\s*cammino\s*[×x]\s*(\d+)/i);
  if (m) {
    const runSec = parseFloat(m[1].replace(",", ".")) * 60;
    const walkSec = parseFloat(m[2].replace(",", ".")) * 60;
    const rounds = parseInt(m[3]);
    return { type: "interval", runSec, walkSec, rounds, totalSec: (runSec + walkSec) * rounds };
  }
  const cm = detail.match(/^(\d+(?:[.,]\d+)?)\s*min/);
  if (cm) return { type: "continuous", totalSec: parseFloat(cm[1].replace(",", ".")) * 60 };
  return { type: "open" };
}

export function derivePhase(session, elapsedSec) {
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

export function scheduleAllBeeps(actx, session) {
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

export function startKeepAlive(actx) {
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
