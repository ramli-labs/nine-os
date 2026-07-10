import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
  dark = false,
}: {
  href?: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-baseline gap-0.5 font-semibold tracking-tight",
        dark ? "text-cream-50" : "text-navy-950",
        className
      )}
    >
      <span className="text-lg">NINE</span>
      <span className={cn("text-lg", dark ? "text-accent-400" : "text-accent-600")}>
        .OS
      </span>
    </Link>
  );
}
