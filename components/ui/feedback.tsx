"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, Loader2, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/** Submit button that reflects the surrounding <form> pending state. */
export function SubmitButton({
  children,
  pendingText = "Menyimpan…",
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

/**
 * One-time secret display (temporary password). Shown exactly once —
 * the value only lives in this render, never in the database.
 */
export function OneTimeSecret({
  secret,
  message,
}: {
  secret: string;
  message?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"
    >
      {message ? (
        <p className="text-sm leading-relaxed text-amber-900">{message}</p>
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        <code className="rounded-lg bg-white px-3 py-2 font-mono text-lg tracking-wider text-navy-950 ring-1 ring-amber-200">
          {secret}
        </code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(secret);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* clipboard unavailable — user copies manually */
            }
          }}
        >
          {copied ? "Tersalin ✓" : "Salin"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-amber-800">
        Catat sekarang — password ini tidak akan ditampilkan lagi.
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-navy-200 bg-white/50 px-6 py-10 text-center",
        className
      )}
    >
      <div className="mb-3 text-navy-300">
        {icon ?? <Inbox className="h-8 w-8" aria-hidden />}
      </div>
      <p className="text-sm font-medium text-navy-800">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-navy-500">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-navy-100/80", className)}
      aria-hidden
    />
  );
}
