"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import type {
  AIHabitSuggestion,
  Bank,
  HabitEntry,
  HabitLibraryEntry,
  Profile,
  RewardRules,
  SavingsHistoryPoint,
  GoalCreateInput,
  SignupInput,
  SpendSaveSummary,
  TimelineResult,
} from "@/lib/types";
import { SCREENS, type ScreenName } from "@/lib/screens";
import { CelebrationOverlay } from "./CelebrationOverlay";
import { TabBar } from "./TabBar";
import { HandoffScreen } from "./screens/HandoffScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { GoalBreakdownScreen } from "./screens/GoalBreakdownScreen";
import { Sheet } from "./Sheet";
import { NewGoalScreen } from "./screens/NewGoalScreen";
import { TimelineScreen } from "./screens/TimelineScreen";
import { HabitsScreen } from "./screens/HabitsScreen";
import { RewardsScreen } from "./screens/RewardsScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { BankLinkScreen } from "./screens/BankLinkScreen";
import { AnalysingScreen } from "./screens/AnalysingScreen";
import { AIRecommendScreen } from "./screens/AIRecommendScreen";

const STEPS: { screen: ScreenName; n: string; label: string }[] = [
  { screen: "linking", n: "01", label: "Connect the bank" },
  { screen: "home", n: "02", label: "Dashboard — how far away?" },
  { screen: "newgoal", n: "03", label: "Set a goal" },
  { screen: "breakdown", n: "04", label: "The reality check" },
  { screen: "rewards", n: "05", label: "Points, and who funds them" },
  { screen: "settings", n: "06", label: "Settings" },
];

export function AppShell() {
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [habits, setHabits] = useState<HabitEntry[] | null>(null);
  const [timeline, setTimeline] = useState<TimelineResult | null>(null);
  const [lever, setLever] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [screen, setScreen] = useState<ScreenName>("handoff");
  const [banks, setBanks] = useState<Bank[]>([]);
  const [habitLibrary, setHabitLibrary] = useState<HabitLibraryEntry[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [entry, setEntry] = useState<"welcome" | "picker">("welcome");
  const [loginBusy, setLoginBusy] = useState(false);
  const [rewardRules, setRewardRules] = useState<RewardRules | null>(null);
  const [savingsHistory, setSavingsHistory] = useState<SavingsHistoryPoint[] | null>(null);
  // Every goal on the dashboard needs its own distance, not just the open one.
  const [goalTimelines, setGoalTimelines] = useState<Record<string, TimelineResult>>({});
  const [spend, setSpend] = useState<SpendSaveSummary | null>(null);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [claimBusy, setClaimBusy] = useState<number | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [aiSuggestions, setAiSuggestions] = useState<AIHabitSuggestion[]>([]);
  const [aiNarration, setAiNarration] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLlmEnhanced, setAiLlmEnhanced] = useState(false);

  const [goalName, setGoalName] = useState("");
  const [goalAmountStr, setGoalAmountStr] = useState("");
  const [idealMonths, setIdealMonths] = useState(12);

  const [floaterText, setFloaterText] = useState("");
  const [floaterKey, setFloaterKey] = useState(0);
  const [celebration, setCelebration] = useState({
    open: false,
    awarded: 0,
    capped: false,
    message: "",
    weeksEarly: 0,
  });

  const leverTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nameTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const amountTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const historyTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const loadDashboard = useCallback(async (prof: Profile) => {
    const [summary, timelines] = await Promise.all([
      api.getSpendSummary(prof.userId),
      Promise.all(
        prof.goals.map((g) =>
          api.getTimeline(prof.userId, g.goalId, 0).then((tl) => [g.goalId, tl] as const)
        )
      ),
    ]);
    setSpend(summary);
    setGoalTimelines(Object.fromEntries(timelines));
  }, []);

  const applyProfile = useCallback(
    (prof: Profile, hab: HabitEntry[], tl: TimelineResult) => {
      const goal = prof.goals[0];
      setPersonaId(prof.userId);
      setProfile(prof);
      setHabits(hab);
      setTimeline(tl);
      setLever(0);
      setActiveGoalId(goal.goalId);
      setGoalName(goal.label);
      setGoalAmountStr(String(Math.round(goal.targetAmount)));
      setIdealMonths(goal.idealTimeframeMonths);
      setSavingsHistory(null);
      api.getSavingsHistory(prof.userId, goal.goalId, 0).then(setSavingsHistory);
      loadDashboard(prof);
    },
    [loadDashboard]
  );

  useEffect(() => {
    (async () => {
      const [payload, profiles] = await Promise.all([api.getPayload(), api.getProfiles()]);
      setBanks(payload.banks);
      setRewardRules(payload.rewardRules);
      setHabitLibrary(payload.habitLibrary);
      setAllProfiles(profiles);
    })();
  }, []);

  const bankName = useCallback(
    (bankId: string) => banks.find((b) => b.bankId === bankId)?.displayName ?? "your bank",
    [banks]
  );
  const partnerName = profile ? bankName(profile.bankId) : "your bank";

  const handleLogin = useCallback(
    async (name: string) => {
      setLoginBusy(true);
      try {
        let res = await api.login(name);
        if (res.profile.userId === "u_maya") {
          const seeded = await api.seedDemo();
          if (seeded.added > 0) res = { ...res, profile: await api.getProfile(res.profile.userId) };
        }
        const goal = res.profile.goals[0];
        const [hab, tl] = await Promise.all([
          api.getHabits(res.profile.userId),
          api.getTimeline(res.profile.userId, goal.goalId, 0),
        ]);
        applyProfile(res.profile, hab, tl);
        if (res.isNew) setAllProfiles((prev) => [res.profile, ...prev]);
        setScreen("linking");
        setLoggedIn(true);
      } finally {
        setLoginBusy(false);
      }
    },
    [applyProfile]
  );

  const handleSignup = useCallback(
    async (input: SignupInput) => {
      setLoginBusy(true);
      try {
        const res = await api.signup(input);
        const goal = res.profile.goals[0];
        const [hab, tl] = await Promise.all([
          api.getHabits(res.profile.userId),
          api.getTimeline(res.profile.userId, goal.goalId, 0),
        ]);
        applyProfile(res.profile, hab, tl);
        setAllProfiles((prev) => [res.profile, ...prev]);
        setScreen("linking");
        setLoggedIn(true);
      } finally {
        setLoginBusy(false);
      }
    },
    [applyProfile]
  );

  const handleLogout = useCallback(() => {
    setLoggedIn(false);
    setEntry("welcome");
    setScreen("linking");
  }, []);

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (!loggedIn) return;
      if (celebration.open) {
        if (ev.key === "Escape") setCelebration((c) => ({ ...c, open: false }));
        return;
      }
      const i = SCREENS.indexOf(screen);
      if (i === -1) return;
      if (ev.key === "ArrowRight") setScreen(SCREENS[Math.min(SCREENS.length - 1, i + 1)]);
      if (ev.key === "ArrowLeft") setScreen(SCREENS[Math.max(0, i - 1)]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, celebration.open, loggedIn]);

  const goal =
    profile?.goals.find((g) => g.goalId === activeGoalId) ?? profile?.goals[0] ?? null;

  const loadAIRecommendations = useCallback(async (pid: string, goalId: string) => {
    setAiLoading(true);
    try {
      const [suggestions, narrated, status] = await Promise.all([
        api.getAIHabits(pid, goalId),
        api.narratePlan(pid, goalId),
        api.getAIStatus(),
      ]);
      setAiSuggestions(suggestions);
      setAiNarration(narrated.narration);
      setAiLlmEnhanced(status.llmEnhanced);
    } finally {
      setAiLoading(false);
    }
  }, []);

  const openGoal = async (goalId: string) => {
    if (!personaId) return;
    setActiveGoalId(goalId);
    setLever(0);
    const opened = profile?.goals.find((g) => g.goalId === goalId);
    if (opened) {
      setGoalName(opened.label);
      setGoalAmountStr(String(Math.round(opened.targetAmount)));
      setIdealMonths(opened.idealTimeframeMonths);
    }
    const [tl, hist] = await Promise.all([
      api.getTimeline(personaId, goalId, 0),
      api.getSavingsHistory(personaId, goalId, 0),
    ]);
    setTimeline(tl);
    setSavingsHistory(hist);
    setGoalTimelines((prev) => ({ ...prev, [goalId]: tl }));
    setScreen("ai-recommend");
    loadAIRecommendations(personaId, goalId);
  };

  const onToggleAIHabit = async (habitId: string) => {
    await onToggleHabit(habitId);
    if (personaId && goal) {
      api.getAIHabits(personaId, goal.goalId).then(setAiSuggestions);
    }
  };

  const onLeverChange = (v: number) => {
    setLever(v);
    if (!goal || !personaId) return;
    clearTimeout(leverTimeout.current);
    leverTimeout.current = setTimeout(async () => {
      const tl = await api.getTimeline(personaId, goal.goalId, v);
      setTimeline(tl);
    }, 30);
    clearTimeout(historyTimeout.current);
    historyTimeout.current = setTimeout(async () => {
      const hist = await api.getSavingsHistory(personaId, goal.goalId, v);
      setSavingsHistory(hist);
    }, 200);
  };

  const onToggleHabit = async (habitId: string) => {
    if (!goal || !personaId) return;
    const res = await api.toggleHabit(personaId, habitId, goal.goalId, lever);
    setHabits((prev) =>
      prev
        ? prev.map((h) =>
            h.habit.habitId === habitId
              ? { habit: res.habit, ticked: res.ticked, explanation: res.explanation }
              : h
          )
        : prev
    );
    setProfile((p) => (p ? { ...p, points: res.points } : p));
    setTimeline(res.timeline);
    setGoalTimelines((prev) => ({ ...prev, [goal.goalId]: res.timeline }));
    if (res.ticked) {
      setFloaterText("+" + res.habit.points);
      setFloaterKey((k) => k + 1);
    }
    api.getSavingsHistory(personaId, goal.goalId, lever).then(setSavingsHistory);
  };

  const onAddCustomHabit = async (label: string, weeklySaving: number) => {
    if (!goal || !personaId) return;
    const res = await api.addCustomHabit(personaId, goal.goalId, lever, { label, weeklySaving });
    setHabits((prev) =>
      prev ? [...prev, { habit: res.habit, ticked: res.ticked, explanation: res.explanation }] : prev
    );
    setProfile((p) => (p ? { ...p, points: res.points } : p));
    setTimeline(res.timeline);
    setFloaterText("+" + res.habit.points);
    setFloaterKey((k) => k + 1);
    api.getSavingsHistory(personaId, goal.goalId, lever).then(setSavingsHistory);
  };

  const onNameChange = (v: string) => {
    setGoalName(v);
    if (!goal || !personaId) return;
    clearTimeout(nameTimeout.current);
    nameTimeout.current = setTimeout(async () => {
      await api.editGoal(personaId, goal.goalId, { label: v.trim() || undefined });
      const tl = await api.getTimeline(personaId, goal.goalId, lever);
      setTimeline(tl);
    }, 300);
  };

  const onAmountChange = (v: string) => {
    const digits = v.replace(/[^0-9]/g, "");
    setGoalAmountStr(digits);
    if (!goal || !personaId) return;
    const n = parseInt(digits, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    clearTimeout(amountTimeout.current);
    amountTimeout.current = setTimeout(async () => {
      await api.editGoal(personaId, goal.goalId, { targetAmount: n });
      const tl = await api.getTimeline(personaId, goal.goalId, lever);
      setTimeline(tl);
    }, 300);
  };

  const onTimeframeChange = async (months: number) => {
    setIdealMonths(months);
    if (!goal || !personaId) return;
    await api.editGoal(personaId, goal.goalId, { idealTimeframeMonths: months });
    const tl = await api.getTimeline(personaId, goal.goalId, lever);
    setTimeline(tl);
  };

  const onCompleteGoal = async () => {
    if (!goal || !personaId) return;
    const weeksBefore = timeline?.weeks ?? null;
    const weeksEarly =
      weeksBefore !== null && timeline && weeksBefore < timeline.idealWeeks
        ? timeline.idealWeeks - weeksBefore
        : 0;
    const res = await api.completeGoal(personaId, goal.goalId);
    setProfile((p) => {
      if (!p) return p;
      const goals = p.goals.map((g) => (g.goalId === res.goal.goalId ? res.goal : g));
      return { ...p, points: res.points, goals };
    });
    const tl = await api.getTimeline(personaId, goal.goalId, lever);
    setTimeline(tl);
    setCelebration({
      open: true,
      awarded: res.capped ? 0 : rewardRules?.goalCompletionPoints ?? 0,
      capped: res.capped,
      message: res.message,
      weeksEarly,
    });
  };

  const onClaimReward = async (tierPoints: number) => {
    if (!personaId) return;
    setClaimBusy(tierPoints);
    try {
      const res = await api.claimReward(personaId, tierPoints);
      setProfile((p) => (p ? { ...p, points: res.points } : p));
      if (!res.alreadyClaimed) {
        setProfile((p) => {
          if (!p) return p;
          const accounts = [...p.accounts];
          accounts[0] = { ...accounts[0], balance: accounts[0].balance + res.creditedGBP };
          return { ...p, accounts };
        });
        setFloaterText(`+${res.tier.reward}`);
        setFloaterKey((k) => k + 1);
      }
    } finally {
      setClaimBusy(null);
    }
  };

  const onCreateGoal = async (input: GoalCreateInput) => {
    if (!personaId) return;
    setCreateBusy(true);
    try {
      const created = await api.createGoal(personaId, input);
      const updated = await api.getProfile(personaId);
      setProfile(updated);
      await loadDashboard(updated);
      await openGoal(created.goalId);
    } finally {
      setCreateBusy(false);
    }
  };

  // Settings writes to the live profile, so the dashboard greeting and the
  // linked-account list move with it (design board 13).
  const onRename = async (name: string) => {
    if (!personaId) return;
    const updated = await api.editProfile(personaId, { displayName: name });
    setProfile(updated);
    setAllProfiles((prev) => prev.map((p) => (p.userId === updated.userId ? updated : p)));
  };

  const onToggleNotifications = async (on: boolean) => {
    if (!personaId) return;
    setProfile((p) => (p ? { ...p, preferences: { notificationsEnabled: on } } : p));
    const updated = await api.editProfile(personaId, { notificationsEnabled: on });
    setProfile(updated);
  };

  const onLinkBank = async () => {
    if (!personaId) return;
    setLinkBusy(true);
    setLinkError(null);
    try {
      const res = await api.linkBank(personaId);
      setProfile((p) =>
        p ? { ...p, linkedBankIds: res.linkedBanks.map((b) => b.bankId) } : p
      );
    } catch {
      setLinkError("Every partner bank is already linked.");
    } finally {
      setLinkBusy(false);
    }
  };

  const onResetDemo = async () => {
    await api.resetDemo();
    const profiles = await api.getProfiles();
    setAllProfiles(profiles);
    handleLogout();
  };

  const points = profile?.points.balance ?? 0;

  if (!rewardRules || !banks.length) {
    return (
      <div className="stage" style={{ gridTemplateColumns: "1fr", justifyItems: "center" }}>
        <p className="muted small">Loading Able AI…</p>
      </div>
    );
  }

  if (!loggedIn || !profile || !timeline || !habits || !goal) {
    return (
      <div className="stage" style={{ gridTemplateColumns: "1fr", justifyItems: "center" }}>
        <div className="phone-wrap">
          <div className="phone">
            <div className="status">
              <span>9:41</span>
              <span>Able AI</span>
            </div>
            <div className="viewport">
              {entry === "welcome" ? (
                <WelcomeScreen
                  onGetStarted={() => setEntry("picker")}
                  onLogIn={() => setEntry("picker")}
                />
              ) : (
              <LoginScreen
                profiles={allProfiles}
                banks={banks}
                habitLibrary={habitLibrary}
                bankName={bankName}
                busy={loginBusy}
                onLogin={handleLogin}
                onSignup={handleSignup}
              />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tickedCount = habits.filter((h) => h.ticked).length;

  return (
    <div className="stage">
      <aside className="rail">
        <div>
          <p className="eyebrow">Work in Fintech · AI Summit 2026</p>
          <h1>Able AI</h1>
          <p className="sub">Turning little habits into big benefits.</p>
        </div>

        <div className="rail-group">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="tiny muted">
              Logged in as <strong style={{ color: "var(--ink)" }}>{profile.displayName}</strong> · {partnerName}
            </span>
            <button className="mini" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>

        <div className="rail-group">
          <nav className="steps" aria-label="Demo steps">
            {STEPS.map((s) => (
              <button key={s.screen} aria-current={screen === s.screen} onClick={() => setScreen(s.screen)}>
                <span className="n">{s.n}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="rail-actions">
          <button className="mini" onClick={onCompleteGoal}>
            Reach the goal
          </button>
          <button className="mini" onClick={onResetDemo}>
            Reset demo
          </button>
        </div>
        <p className="hint">
          ← → move through the run of show. Everything recalculates live from the backend.
        </p>
      </aside>

      <div className="phone-wrap">
        <div className="phone">
          <div className="status">
            <span>9:41</span>
            <span>{partnerName} · connected</span>
          </div>
          <div className="viewport">
            <div className={`floater${floaterKey > 0 ? " go" : ""}`} key={floaterKey}>
              {floaterText}
            </div>

            {screen === "linking" && (
              <BankLinkScreen
                banks={banks}
                suggestedBankId={profile.bankId}
                onContinue={() => setScreen("analysing")}
              />
            )}
            {screen === "analysing" && (
              <AnalysingScreen
                profile={profile}
                bankName={partnerName}
                onDone={() => setScreen("home")}
              />
            )}
            {screen === "handoff" && <HandoffScreen partnerName={partnerName} onStart={() => setScreen("home")} />}
            {screen === "home" && (
              <HomeScreen
                profile={profile}
                goals={profile.goals}
                timelines={goalTimelines}
                spend={spend}
                onOpenGoal={openGoal}
                onCreateGoal={() => setScreen("newgoal")}
                onOpenSettings={() => setScreen("settings")}
              />
            )}
            {screen === "editgoal" && (
              <section className="screen" data-screen="editgoal">
                <div className="col" style={{ gap: 8 }}>
                  <span className="eyebrow">Edit target</span>
                  <h2 className="h-lg">{goal.label}</h2>
                </div>
                <Sheet
                  emoji={goal.emoji}
                  name={goalName}
                  amount={goalAmountStr ? Number(goalAmountStr).toLocaleString("en-GB") : ""}
                  idealMonths={idealMonths}
                  onNameChange={onNameChange}
                  onAmountChange={onAmountChange}
                  onTimeframeChange={onTimeframeChange}
                />
                <button
                  className="btn"
                  style={{ marginTop: "auto" }}
                  onClick={async () => {
                    const tl = await api.getTimeline(profile.userId, goal.goalId, lever);
                    setTimeline(tl);
                    setGoalTimelines((prev) => ({ ...prev, [goal.goalId]: tl }));
                    setProfile(await api.getProfile(profile.userId));
                    setScreen("breakdown");
                  }}
                >
                  Done
                </button>
              </section>
            )}
            {screen === "newgoal" && (
              <NewGoalScreen
                profile={profile}
                busy={createBusy}
                onCreate={onCreateGoal}
                onCancel={() => setScreen("home")}
              />
            )}
            {screen === "ai-recommend" && (
              <AIRecommendScreen
                goalName={goal.label}
                goalEmoji={goal.emoji}
                points={points}
                loading={aiLoading}
                narration={aiNarration}
                llmEnhanced={aiLlmEnhanced}
                suggestions={aiSuggestions}
                onToggle={onToggleAIHabit}
                onBack={() => setScreen("home")}
                onContinue={() => setScreen("breakdown")}
              />
            )}
            {screen === "breakdown" && (
              <GoalBreakdownScreen
                goal={goal}
                timeline={timeline}
                habits={habits}
                points={points}
                onBack={() => setScreen("home")}
                onToggleHabit={onToggleHabit}
                onEditTarget={() => setScreen("editgoal")}
                onComplete={onCompleteGoal}
                onKeepSaving={() => setScreen("home")}
              />
            )}
            {screen === "timeline" && (
              <TimelineScreen
                goalEmoji={goal.emoji}
                goalName={goal.label}
                timeline={timeline}
                points={points}
                lever={lever}
                isDragging={isDragging}
                savingsHistory={savingsHistory}
                onLeverChange={onLeverChange}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={() => setIsDragging(false)}
                onBack={() => setScreen("home")}
                onLockHabits={() => setScreen("habits")}
              />
            )}
            {screen === "habits" && (
              <HabitsScreen
                goalName={goal.label}
                habits={habits}
                timeline={timeline}
                points={points}
                tickedCount={tickedCount}
                onToggleHabit={onToggleHabit}
                onAddCustomHabit={onAddCustomHabit}
                onSeeRewards={() => setScreen("rewards")}
              />
            )}
            {screen === "rewards" && (
              <RewardsScreen
                partnerName={partnerName}
                points={points}
                tiers={rewardRules.pointsToRewardTiers}
                pointsPerGBP={rewardRules.pointsPerGBP}
                claimedTierPoints={profile.points.claimedTierPoints}
                claimBusy={claimBusy}
                onClaim={onClaimReward}
              />
            )}
            {screen === "settings" && (
              <SettingsScreen
                profile={profile}
                banks={banks}
                onRename={onRename}
                onToggleNotifications={onToggleNotifications}
                onLinkBank={onLinkBank}
                linkBusy={linkBusy}
                linkError={linkError}
              />
            )}
          </div>

          <CelebrationOverlay
            open={celebration.open}
            goalName={goal.label}
            targetAmount={money(goal.targetAmount)}
            awarded={celebration.awarded}
            capped={celebration.capped}
            message={celebration.message}
            weeksEarly={celebration.weeksEarly}
            partnerName={partnerName}
            pointsPerGBP={rewardRules.pointsPerGBP}
            onSeeRewards={() => {
              setCelebration((c) => ({ ...c, open: false }));
              setScreen("rewards");
            }}
            onBack={() => {
              setCelebration((c) => ({ ...c, open: false }));
              setScreen("home");
            }}
          />

          <TabBar current={screen} onGo={setScreen} />
        </div>
      </div>
    </div>
  );
}
