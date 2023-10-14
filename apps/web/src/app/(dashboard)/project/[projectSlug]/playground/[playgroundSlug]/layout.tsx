import { notFound } from "next/navigation";
import { ModuleHeader } from "./components/module-header";
import { getWorkflowMeta } from "@/actions/get-workflow-meta";

const PlaygroundLayout = async (props: {
  params: {
    projectSlug: string;
    playgroundSlug: string;
  };
  children: React.ReactNode;
}) => {
  // TODO: make amount we fetch configurable
  const { data: playground, serverError } = await getWorkflowMeta({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.playgroundSlug,
  });
  if (!playground) return notFound();

  return (
    <div className="max-w-7xl mx-auto py-2 sm:py-5 px-4">
      <ModuleHeader workflow={playground} />
      {props.children}
    </div>
  );
};

export default PlaygroundLayout;
