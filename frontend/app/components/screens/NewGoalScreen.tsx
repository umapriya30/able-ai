import { PrimaryButton } from "../Buttons";
import { Sheet } from "../Sheet";

export function NewGoalScreen({
  emoji,
  name,
  amount,
  idealMonths,
  onNameChange,
  onAmountChange,
  onTimeframeChange,
  onSeeTimeline,
}: {
  emoji: string;
  name: string;
  amount: string;
  idealMonths: number;
  onNameChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onTimeframeChange: (m: number) => void;
  onSeeTimeline: () => void;
}) {
  return (
    <section className="screen" data-screen="newgoal">
      <p className="eyebrow" style={{ marginTop: 18 }}>
        New goal
      </p>
      <h2 className="h-lg">What are you saving for?</h2>
      <Sheet
        emoji={emoji}
        name={name}
        amount={amount}
        idealMonths={idealMonths}
        onNameChange={onNameChange}
        onAmountChange={onAmountChange}
        onTimeframeChange={onTimeframeChange}
      />
      <p className="tiny muted">Able works out what that actually takes. It never tells you where to put your money.</p>
      <div style={{ flex: 1 }} />
      <PrimaryButton onClick={onSeeTimeline}>See my timeline</PrimaryButton>
    </section>
  );
}
