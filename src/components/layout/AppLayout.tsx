import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { FooterDisclaimer } from "./FooterDisclaimer";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground md:flex-row">
      <Sidebar />
      <main className="flex min-h-[calc(100vh)] w-full min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex-1">{children}</div>
        <FooterDisclaimer />
      </main>
    </div>
  );
}
