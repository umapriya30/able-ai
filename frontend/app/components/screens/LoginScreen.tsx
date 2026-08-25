import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/lib/icons";
import { Chip } from "../Chip";
import { PrimaryButton } from "../Buttons";
import type { Bank, CustomHabitInput, HabitLibraryEntry, Persona, Profile, SignupInput } from "@/lib/types";

const PERSONA_LABEL: Record<Persona, string> = {
  young_professional: "Young professional",
  secondary_school: "Secondary school",
  university_student: "University student",
  gig_worker: "Gig worker",
};

const PERSONAS: Persona[] = ["young_professional", "secondary_school", "university_student", "gig_worker"];

const TIMEFRAMES = [
  { m: 3, l: "3 mo" },
  { m: 6, l: "6 mo" },
  { m: 12, l: "12 mo" },
  { m: 24, l: "2 yrs" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="col" style={{ gap: 4 }}>
      <span className="tiny muted">{label}</span>
      {children}
    </div>
  );
}

function TextRow({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="row card" style={{ background: "var(--card)", padding: "10px 14px" }}>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", font: "600 15px var(--ui)", color: "var(--ink)" }}
      />
    </div>
  );
}

function AmountRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="row card" style={{ background: "var(--card)", padding: "10px 14px", gap: 4 }}>
      <span className="num" style={{ fontSize: 18 }}>
        £
      </span>
      <input
        value={value}
        inputMode="numeric"
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          background: "transparent",
          font: "700 18px var(--display)",
          color: "var(--ink)",
          fontVariantNumeric: "tabular-nums",
        }}
      />
    </div>
  );
}

const PERSONA_DEFAULT_AGE: Record<Persona, string> = {
  young_professional: "25",
  secondary_school: "18",
  university_student: "20",
  gig_worker: "24",
};

export function LoginScreen({
  profiles,
  banks,
  habitLibrary,
  bankName,
  busy,
  onLogin,
  onSignup,
}: {
  profiles: Profile[];
  banks: Bank[];
  habitLibrary: HabitLibraryEntry[];
  bankName: (bankId: string) => string;
  busy: boolean;
  onLogin: (name: string) => void;
  onSignup: (input: SignupInput) => void;
}) {
  const [mode, setMode] = useState<"search" | "create">("search");
  const [query, setQuery] = useState("");

  const [name, setName] = useState("");
  const [age, setAge] = useState(PERSONA_DEFAULT_AGE.young_professional);
  const [ageTouched, setAgeTouched] = useState(false);
  const [persona, setPersona] = useState<Persona>("young_professional");
  const [bankId, setBankId] = useState(banks[0]?.bankId ?? "");
  const [income, setIncome] = useState("2000");
  const [goalLabel, setGoalLabel] = useState("");
  const [target, setTarget] = useState("1000");
  const [idealMonths, setIdealMonths] = useState(12);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [customHabits, setCustomHabits] = useState<CustomHabitInput[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [customAmount, setCustomAmount] = useState("");

  const personaHabits = useMemo(
    () => habitLibrary.filter((h) => h.personas.includes(persona)),
    [habitLibrary, persona]
  );

  useEffect(() => {
    if (!ageTouched) setAge(PERSONA_DEFAULT_AGE[persona]);
    setSelectedHabits((prev) => prev.filter((id) => personaHabits.some((h) => h.habitId === id)));
  }, [persona, ageTouched, personaHabits]);

  const toggleHabit = (habitId: string) => {
    setSelectedHabits((prev) => (prev.includes(habitId) ? prev.filter((id) => id !== habitId) : [...prev, habitId]));
  };

  const addCustomHabit = () => {
    const label = customLabel.trim();
    const weeklySaving = Number(customAmount);
    if (!label || !(weeklySaving > 0)) return;
    setCustomHabits((prev) => [...prev, { label, weeklySaving }]);
    setCustomLabel("");
    setCustomAmount("");
  };

  const removeCustomHabit = (index: number) => {
    setCustomHabits((prev) => prev.filter((_, i) => i !== index));
  };

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return profiles.slice(0, 8);
    return profiles.filter((p) => p.displayName.toLowerCase().includes(needle)).slice(0, 8);
  }, [profiles, query]);

  const exact = profiles.some((p) => p.displayName.toLowerCase() === query.trim().toLowerCase());

  const ageNum = Number(age);
  const validAge = age.trim() !== "" && ageNum >= 18 && ageNum <= 25;
  const canCreate = name.trim() && validAge && bankId && Number(income) > 0 && goalLabel.trim() && Number(target) > 0;

  const submitCreate = () => {
    if (!canCreate) return;
    onSignup({
      name: name.trim(),
      age: ageNum,
      persona,
      bankId,
      monthlyIncome: Number(income),
      goalLabel: goalLabel.trim(),
      targetAmount: Number(target),
      idealTimeframeMonths: idealMonths,
      startingSaved: 0,
      initialHabitIds: selectedHabits,
      customHabits,
    });
  };

  return (
    <section className="screen" data-screen="login">
      <div className="row" style={{ marginTop: 24, justifyContent: "flex-start", gap: 12 }}>
        <div className="brandmark">
          <Icon name="mark" />
        </div>
        <div className="col" style={{ gap: 0 }}>
          <strong style={{ fontSize: 16 }}>Able AI</strong>
          <span className="tiny muted">
            {profiles.length} accounts, {new Set(profiles.map((p) => p.bankId)).size} banks connected
          </span>
        </div>
      </div>

      <div className="seg" role="group" aria-label="Login mode" style={{ marginTop: 16 }}>
        <button aria-pressed={mode === "search"} onClick={() => setMode("search")}>
          Find my account
        </button>
        <button aria-pressed={mode === "create"} onClick={() => setMode("create")}>
          Create account
        </button>
      </div>

      {mode === "search" ? (
        <>
          <h2 className="h-lg" style={{ marginTop: 16 }}>
            Who&rsquo;s this?
          </h2>
          <p className="muted small">Search an existing demo account, or type a new name to create one.</p>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search accounts by name"
            style={{ minWidth: 0 }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) onLogin(query.trim());
            }}
          />

          <div className="col" style={{ gap: 8 }}>
            {matches.map((p) => (
              <button
                key={p.userId}
                className="card row"
                style={{ cursor: "pointer", textAlign: "left" }}
                onClick={() => onLogin(p.displayName)}
                disabled={busy}
              >
                <span className="col" style={{ gap: 2 }}>
                  <span className="small" style={{ fontWeight: 600 }}>
                    {p.displayName}
                  </span>
                  <span className="tiny muted">
                    {PERSONA_LABEL[p.persona] ?? p.persona} · {bankName(p.bankId)}
                  </span>
                </span>
                <Chip>{p.age}</Chip>
              </button>
            ))}
            {matches.length === 0 && <p className="tiny muted">No match — press Enter to create a new account for &ldquo;{query}&rdquo;.</p>}
          </div>

          {query.trim() && !exact && (
            <PrimaryButton onClick={() => onLogin(query.trim())} disabled={busy}>
              {busy ? "Setting up…" : `Log in as new: "${query.trim()}"`}
            </PrimaryButton>
          )}
        </>
      ) : (
        <>
          <h2 className="h-lg" style={{ marginTop: 16 }}>
            Set up your account
          </h2>
          <p className="muted small">Real inputs, not a random one — this builds your profile from what you tell it.</p>

          <Field label="Your name">
            <TextRow value={name} onChange={setName} placeholder="e.g. Sam" />
          </Field>

          <Field label="Your age">
            <div className="row card" style={{ background: "var(--card)", padding: "10px 14px" }}>
              <input
                value={age}
                inputMode="numeric"
                placeholder="18–25"
                onChange={(e) => {
                  setAgeTouched(true);
                  setAge(e.target.value.replace(/[^0-9]/g, "").slice(0, 2));
                }}
                style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", font: "600 15px var(--ui)", color: "var(--ink)" }}
              />
            </div>
          </Field>

          <Field label="Which fits you best?">
            <div className="row" style={{ justifyContent: "flex-start", flexWrap: "wrap", gap: 8 }}>
              {PERSONAS.map((p) => (
                <Chip key={p} variant={persona === p ? "sel" : "default"} onClick={() => setPersona(p)}>
                  {PERSONA_LABEL[p]}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Your bank">
            <div className="row" style={{ justifyContent: "flex-start", flexWrap: "wrap", gap: 8 }}>
              {banks.map((b) => (
                <Chip key={b.bankId} variant={bankId === b.bankId ? "sel" : "default"} onClick={() => setBankId(b.bankId)}>
                  {b.displayName}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Habits to start with (optional)">
            <div className="col" style={{ gap: 10 }}>
              {(personaHabits.length > 0 || customHabits.length > 0) && (
                <div className="row" style={{ justifyContent: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  {personaHabits.map((h) => (
                    <Chip
                      key={h.habitId}
                      variant={selectedHabits.includes(h.habitId) ? "sel" : "default"}
                      onClick={() => toggleHabit(h.habitId)}
                    >
                      {h.label} · +{h.points}
                    </Chip>
                  ))}
                  {customHabits.map((h, i) => (
                    <Chip key={`custom-${i}`} variant="sel" onClick={() => removeCustomHabit(i)}>
                      {h.label} · £{h.weeklySaving.toFixed(0)}/wk ✕
                    </Chip>
                  ))}
                </div>
              )}
              <div className="row card" style={{ background: "var(--card)", padding: "10px 14px", minWidth: 0 }}>
                <input
                  value={customLabel}
                  placeholder="Add your own habit…"
                  onChange={(e) => setCustomLabel(e.target.value)}
                  style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", font: "600 15px var(--ui)", color: "var(--ink)" }}
                />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <div className="row card" style={{ background: "var(--card)", padding: "10px 14px", gap: 4, flex: 1, minWidth: 0 }}>
                  <span className="num" style={{ fontSize: 15 }}>
                    £
                  </span>
                  <input
                    value={customAmount}
                    inputMode="numeric"
                    placeholder="/wk"
                    onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, ""))}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: "none",
                      background: "transparent",
                      font: "600 15px var(--ui)",
                      color: "var(--ink)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  />
                </div>
                <Chip onClick={addCustomHabit}>Add</Chip>
              </div>
            </div>
          </Field>

          <Field label="Monthly income">
            <AmountRow value={income} onChange={setIncome} />
          </Field>

          <Field label="What are you saving for?">
            <TextRow value={goalLabel} onChange={setGoalLabel} placeholder="e.g. New laptop" />
          </Field>

          <Field label="Target amount">
            <AmountRow value={target} onChange={setTarget} />
          </Field>

          <Field label="Ideally by when?">
            <div className="row" style={{ justifyContent: "flex-start", flexWrap: "wrap", gap: 8 }}>
              {TIMEFRAMES.map((t) => (
                <Chip key={t.m} variant={idealMonths === t.m ? "sel" : "default"} onClick={() => setIdealMonths(t.m)}>
                  {t.l}
                </Chip>
              ))}
            </div>
          </Field>

          <PrimaryButton onClick={submitCreate} disabled={!canCreate || busy}>
            {busy ? "Setting up…" : "Create account"}
          </PrimaryButton>
          {!canCreate && <p className="tiny muted">Fill in your name, a valid age (18–25), income, and goal to continue.</p>}
        </>
      )}

      <div style={{ flex: 1 }} />
      <p className="tiny muted">Demo login only — no password, nothing real is stored.</p>
    </section>
  );
}
