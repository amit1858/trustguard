import type { GuardianOutput } from "@/lib/types";

export default function ActionsColumns({ guardian }: { guardian: GuardianOutput }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Column
        title="Allowed actions"
        items={guardian.allowedActions}
        color="#6FB089"
        icon="✓"
        empty="No actions allowed"
      />
      <Column
        title="Blocked actions"
        items={guardian.blockedActions}
        color="#B83A3A"
        icon="⛔"
        empty="No actions blocked"
      />
    </section>
  );
}

function Column({
  title,
  items,
  color,
  icon,
  empty,
}: {
  title: string;
  items: string[];
  color: string;
  icon: string;
  empty: string;
}) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-[var(--ink-2)]">{title}</div>
        <span className="pill" style={{ borderColor: `${color}55`, color }}>{items.length}</span>
      </div>
      <ul className="space-y-2">
        {items.length === 0 && (
          <li className="text-xs text-[var(--ink-2)]">{empty}</li>
        )}
        {items.map((a) => (
          <li key={a} className="flex gap-2 text-sm">
            <span style={{ color }}>{icon}</span>
            <span className="text-[var(--ink-0)]/90">{a}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
