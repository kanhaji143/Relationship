import type { ReactNode } from "react";

type CalloutProps = {
  title: string;
  children: ReactNode;
};

export function Callout({ title, children }: CalloutProps) {
  return (
    <div className="border-line rounded-xl border bg-white/60 p-5 dark:bg-white/[0.03]">
      <h3 className="text-ink text-base font-semibold">{title}</h3>
      <p className="text-ink-muted mt-2 text-sm leading-relaxed">{children}</p>
    </div>
  );
}
