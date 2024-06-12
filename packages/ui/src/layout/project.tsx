export const ProjectLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col items-center p-10">{children}</div>;
};

ProjectLayout.Content = ({ children }: { children: React.ReactNode }) => (
  <div className="grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-12">
    {children}
  </div>
);
