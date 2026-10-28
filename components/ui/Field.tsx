import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

export function Field({ id, label, hint, error, className = "", ...props }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ink text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`text-ink placeholder:text-ink-muted/70 focus:border-brand min-h-11 rounded-lg border bg-white px-3.5 py-2.5 text-base focus:outline-none dark:bg-white/[0.04] ${
          error ? "border-red-600" : "border-line"
        } ${className}`}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-ink-muted text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
