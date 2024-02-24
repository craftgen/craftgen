import { notFound } from "next/navigation";

import { api } from "@/trpc/server";

import { ModuleHeader } from "./components/module-header";

const PlaygroundLayout = async (props: {
  params: {
    projectSlug: string;
    workflowSlug: string;
  };
  children: React.ReactNode;
}) => {
  const workflow = await api.craft.module.meta({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.workflowSlug,
  });
  console.log("@@@", workflow);
  if (!workflow) return notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-2 sm:py-5">
      <ModuleHeader workflow={workflow} />
      {props.children}
    </div>
  );
};

export default PlaygroundLayout;
