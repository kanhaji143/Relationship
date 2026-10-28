import { MarketingShell } from "@/components/layout/MarketingShell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell>
      <div className="mx-auto w-full max-w-md px-5 py-12 sm:px-8 sm:py-16">{children}</div>
    </MarketingShell>
  );
}
