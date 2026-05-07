import { ALL_DAYS } from "../data/weekPlans";

export function getAvailableRunDays(tDays) {
  const forbidden = new Set(tDays);
  tDays.forEach(d => forbidden.add((d + 1) % 7));
  return ALL_DAYS.filter(d => !forbidden.has(d));
}

export function buildInitialSchedule(tDays, sessions) {
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
