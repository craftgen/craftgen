export const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <main className="flex min-h-screen w-full flex-col bg-muted/40">
      {children}
    </main>
  );
};

DashboardLayout.Content = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">{children}</div>
);
