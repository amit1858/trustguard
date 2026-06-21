"use client";

export default function WalkthroughButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition"
      style={{
        borderColor: "rgba(245, 158, 46, 0.55)",
        background: "linear-gradient(90deg, rgba(245, 158, 46, 0.22), rgba(155, 137, 184, 0.22))",
        color: "#fae8ff",
        boxShadow: "0 0 18px rgba(245, 158, 46, 0.25)",
      }}
    >
      <span>▶</span>
      <span>Start Demo Walkthrough</span>
    </button>
  );
}
