import { GoogleOneTap } from "@clerk/nextjs";

import { Footer } from "./footer";
import { NavBar } from "./navbar";

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="">
      <NavBar session={null} />
      {children}
      <GoogleOneTap />
      <Footer />
    </main>
  );
};

export default PublicLayout;
