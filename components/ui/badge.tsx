import * as React from "react";
import { cn } from "@/lib/utils";
import type { RequestStatus, RequestUrgency } from "@/lib/types";
import { STATUS_LABELS, URGENCY_LABELS } from "@/lib/labels";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "blue" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-navy-100 text-navy-700",
    blue: "bg-navy-200/70 text-navy-800",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const tone =
    status === "submitted"
      ? "blue"
      : status === "seen"
        ? "amber"
        : status === "follow_up"
          ? "amber"
          : "green";
  return <Badge tone={tone}>{STATUS_LABELS[status]}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: RequestUrgency }) {
  const tone =
    urgency === "soon" ? "red" : urgency === "this_week" ? "amber" : "neutral";
  return <Badge tone={tone}>{URGENCY_LABELS[urgency]}</Badge>;
}
