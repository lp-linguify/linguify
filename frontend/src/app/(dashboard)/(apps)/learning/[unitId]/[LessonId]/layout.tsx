export default function LessonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent dark:bg-transparent">
      <main className="flex-1 overflow-auto transform scale-[0.9] origin-top">
        {children}
      </main>
    </div>
  );
}
