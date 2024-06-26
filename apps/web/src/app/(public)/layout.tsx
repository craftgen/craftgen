import { Footer } from "./footer";
import { NavBar } from "./navbar";

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="">
      <NavBar session={null} />
      {children}
      <Footer />
    </main>
  );
};

export default PublicLayout;
