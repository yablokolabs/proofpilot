import type { Status } from "@/lib/types";

export type DisplayStatus = Status | "pending";

const STATUS: Record<DisplayStatus, { label: string; icon: string; className: string }> = {
  supported: { label: "Supported", icon: "✓", className: "bg-supported text-white" },
  contradicted: { label: "Contradicted", icon: "✕", className: "bg-contradicted text-white" },
  unverified: { label: "Unverified", icon: "?", className: "bg-unverified text-white" },
  pending: { label: "Checking", icon: "…", className: "bg-pending text-white" },
};

export function statusLabel(status: DisplayStatus): string {
  return STATUS[status].label;
}

export function StatusBadge({ status, size = "sm" }: { status: DisplayStatus; size?: "sm" | "md" }) {
  const { label, icon, className } = STATUS[status];
  const sizing = size === "md" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[0.65rem]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm font-sans font-semibold uppercase tracking-wide whitespace-nowrap ${sizing} ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
