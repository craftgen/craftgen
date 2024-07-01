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
  <div className="relative flex  flex-col sm:pl-16 ">{children}</div>
);
