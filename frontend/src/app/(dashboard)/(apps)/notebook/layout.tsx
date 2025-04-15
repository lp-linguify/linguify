import QueryProvider from '@/core/providers/QueryProvider';

export default function NotebookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      {children}
    </QueryProvider>
  );
}