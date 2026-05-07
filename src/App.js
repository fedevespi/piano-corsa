import { useState, useEffect, useRef } from "react";
import { WEEK_PLANS } from "./data/weekPlans";
import { buildInitialSchedule } from "./utils/schedule";
import { STORAGE_KEY, saveToStorage, loadFromStorage } from "./utils/storage";
import { parseSession, scheduleAllBeeps, startKeepAlive } from "./utils/timer";
import SetupScreen from "./components/SetupScreen";
import PlanScreen from "./components/PlanScreen";
import TimerOverlay from "./components/TimerOverlay";

export default function App() {
  const [state, setState] = useState(() => {
    const saved = loadFromStorage();
    if (saved) return { screen: "plan", ...saved };
    return { screen: "setup", defaultTennis: new Set(), weekTennis: [], weekSchedules: [] };
  });

  const [activeTimer, setActiveTimer] = useState(null);
  const audioCtxRef = useRef(null);
  const keepAliveRef = useRef(null);

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
    const tArr = Array.from(selected).sort((a, b) => a - b);
    setState({
      screen: "plan",
      defaultTennis: selected,
      weekTennis: WEEK_PLANS.map(() => new Set(selected)),
      weekSchedules: WEEK_PLANS.map(w => buildInitialSchedule(tArr, w.sessions)),
    });
  };

  const handleToggleTennis = (wi, di) => {
    setState(prev => {
      const weekTennis = prev.weekTennis.map(s => new Set(s));
      weekTennis[wi].has(di) ? weekTennis[wi].delete(di) : weekTennis[wi].add(di);
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
