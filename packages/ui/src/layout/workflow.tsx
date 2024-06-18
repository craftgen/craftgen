export const WorkflowLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className=" mx-auto w-full max-w-6xl px-4 py-2 sm:py-5 ">
      {children}
    </div>
  );
};

WorkflowLayout.Content = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-4">{children}</div>
);
