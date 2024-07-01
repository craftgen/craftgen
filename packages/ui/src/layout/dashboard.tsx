import { cn } from "../lib/utils";

export const DashboardLayout = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <main
      className={cn("flex min-h-screen w-full flex-col bg-muted/40", className)}
    >
      {children}
    </main>
  );
};

DashboardLayout.Content = ({ children }: { children: React.ReactNode }) => (
  <div className="relative flex  flex-col sm:pl-16 ">{children}</div>
);
