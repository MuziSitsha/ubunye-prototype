import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col">
      <div className="flex-1 pb-4">{children}</div>
      <BottomNav />
    </div>
  );
}
