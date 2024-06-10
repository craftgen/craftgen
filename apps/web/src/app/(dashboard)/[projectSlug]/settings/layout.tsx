import type { PropsWithChildren } from "react";
import { redirect, useParams } from "next/navigation";

import { Separator } from "@craftgen/ui/components/separator";

import { api } from "@/trpc/server";

import { SidebarNav } from "./components/sidebar-nav";

const sidebarNavItems = [
  {
    title: "Project",
    href: "/[projectSlug]/settings",
  },
  {
    title: "Integrations",
    href: "/[projectSlug]/settings/integrations",
  },
  {
    title: "Variables",
    href: "/[projectSlug]/settings/tokens",
  },
  {
    title: "Payment",
    href: "/[projectSlug]/settings/payment",
  },
];

const ProjectSettingPageLayout: React.FC<
  PropsWithChildren<{
    params: {
      projectSlug: string;
    };
  }>
> = async ({ children, params }) => {
  const session = await api.auth.getSession();
  if (!session || session?.currentProjectSlug !== params.projectSlug) {
    redirect(`/${params.projectSlug}`);
  }
  return (
    <>
      <div className=" space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your project settings.</p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  );
};

export default ProjectSettingPageLayout;
