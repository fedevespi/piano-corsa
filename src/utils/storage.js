export const STORAGE_KEY = "piano-corsa-v1";

export function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      defaultTennis: Array.from(data.defaultTennis),
      weekTennis: data.weekTennis.map(s => Array.from(s)),
      weekSchedules: data.weekSchedules,
      weekPlans: data.weekPlans,
      planStartDate: data.planStartDate,
    }));
  } catch (_) {}
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      defaultTennis: new Set(parsed.defaultTennis),
      weekTennis: parsed.weekTennis.map(a => new Set(a)),
      weekSchedules: parsed.weekSchedules,
      weekPlans: parsed.weekPlans ?? null,
      planStartDate: parsed.planStartDate ?? null,
    };
  } catch (_) { return null; }
}
