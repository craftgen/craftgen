import { NavBar } from "./navbar";

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="pb-10">
      <NavBar session={null} />
      {children}
    </main>
  );
};

export default PublicLayout;
