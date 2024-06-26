const LegalLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mx-auto flex flex-col items-center justify-center p-4 ">
      {children}
    </div>
  );
};

export default LegalLayout;
