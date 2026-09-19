import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Restored",
  robots: { index: false, follow: false },
};

export default function AccountRestoredLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
