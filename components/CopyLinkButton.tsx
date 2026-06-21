"use client";

import { buildDeepLink, copyToClipboard, type DeepLinkState } from "@/lib/deepLinks";
import { useToast } from "@/components/Toast";

export default function CopyLinkButton({
  state,
  label = "Copy link",
  size = "sm",
}: {
  state: DeepLinkState;
  label?: string;
  size?: "sm" | "md";
}) {
  const { show } = useToast();

  async function handle() {
    const link = buildDeepLink(state);
    const ok = await copyToClipboard(link);
    if (ok) show("Deep link copied to clipboard.", "success");
    else show("Could not copy link. Please copy from the address bar.", "warn");
  }

  const cls =
    size === "md"
      ? "btn btn-ghost text-xs"
      : "pill text-[10px]";

  return (
    <button
      onClick={handle}
      className={cls}
      title="Copy a shareable link to this exact view"
    >
      🔗 {label}
    </button>
  );
}
