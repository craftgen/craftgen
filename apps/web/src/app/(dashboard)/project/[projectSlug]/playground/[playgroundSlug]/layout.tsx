import { notFound } from "next/navigation";

import { api } from "@/trpc/server";

import { ModuleHeader } from "./components/module-header";

const PlaygroundLayout = async (props: {
  params: {
    projectSlug: string;
    playgroundSlug: string;
  };
  children: React.ReactNode;
}) => {
  const workflow = await api.craft.module.meta.query({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.playgroundSlug,
  });
  if (!workflow) return notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-2 sm:py-5">
      <ModuleHeader workflow={workflow} />
      {props.children}
    </div>
  );
};

export default PlaygroundLayout;
