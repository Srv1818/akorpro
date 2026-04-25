export default function AdminMetodEditLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-bg">
      {children}
    </div>
  );
}
