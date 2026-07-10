import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-navy-800", className)}
      {...props}
    />
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-navy-200 bg-white px-3.5 text-base text-navy-950 placeholder:text-navy-400 focus:border-navy-500 sm:text-sm",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-navy-200 bg-white px-3.5 py-3 text-base text-navy-950 placeholder:text-navy-400 focus:border-navy-500 sm:text-sm",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full appearance-none rounded-xl border border-navy-200 bg-white px-3.5 text-base text-navy-950 focus:border-navy-500 sm:text-sm",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-700">{message}</p>;
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-sm text-navy-500">{children}</p>;
}
