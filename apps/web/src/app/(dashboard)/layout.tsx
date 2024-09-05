import Link from "next/link";
import { OrganizationSwitcher } from "@clerk/nextjs";

import { Icons } from "@craftgen/ui/components/icons";
import { Sidebar } from "@craftgen/ui/components/sidebar";
import { DashboardLayout } from "@craftgen/ui/layout/dashboard";
import { Navbar } from "@craftgen/ui/views/navbar";

import { createClient } from "@/utils/supabase/server";

import { persistGoogleToken } from "./actions";
import { UserNavWrapper } from "./user-nav";

export const dynamic = "force-dynamic";
export const revalidate = 10;
const Layout = async ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.provider_refresh_token && session?.provider_token) {
    await persistGoogleToken();
  }
  return (
    <DashboardLayout>
      <Sidebar
        Link={Link}
        logoLinkProps={{
          href: `/${session?.user?.user_metadata?.currentProjectSlug}`,
        }}
        topLinks={[
          {
            label: "Explore",
            icon: <Icons.globe className="h-5 w-5" />,
            linkProps: { href: "/explore" },
          },
        ]}
        bottomLinks={[]}
      />
      <DashboardLayout.Content>
        <Navbar Link={Link} organizationSwitcher={<OrganizationSwitcher />}>
          <UserNavWrapper />
        </Navbar>
        {children}
      </DashboardLayout.Content>
    </DashboardLayout>
  );
};

export default Layout;
