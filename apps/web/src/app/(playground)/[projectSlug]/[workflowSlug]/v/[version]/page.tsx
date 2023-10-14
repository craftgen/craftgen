import { Playground } from "./playground";
import "@/core/rete.css";
import { CreateReleaseButton } from "./components/create-release-button";
import { MenubarDemo } from "./components/menubar";
import { VersionHistory } from "./components/version-history";
import { RestoreVersionButton } from "./components/restore-version-button";
import { redirect } from "next/navigation";
import { getWorkflow } from "@/actions/get-workflow";

const PlaygroundPage = async (props: {
  params: {
    projectSlug: string;
    workflowSlug: string;
    version: string;
  };
  searchParams: {
    execution?: string;
  };
}) => {
  console.log({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.workflowSlug,
    executionId: props.searchParams.execution,
    version: Number(props.params.version),
  });
  const { data: workflow } = await getWorkflow({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.workflowSlug,
    executionId: props.searchParams.execution,
    version: Number(props.params.version),
  });

  if (!workflow) return <div>Not found</div>;
  if (!workflow.execution && props.searchParams.execution) {
    redirect(
      `/${props.params.projectSlug}/${props.params.workflowSlug}/v/${props.params.version}`
    );
  }
  return (
    <div className="border-t-1 border-red-400">
      <div className="flex items-center w-full justify-between border-b-2 ">
        <MenubarDemo />
        <div className="flex space-x-2 items-center">
          <VersionHistory workflow={workflow} />
          {!workflow.version.publishedAt ? (
            <CreateReleaseButton
              playgroundId={workflow.id}
              version={workflow.currentVersion}
            />
          ) : (
            <RestoreVersionButton />
          )}
        </div>
      </div>
      <Playground workflow={workflow} />
    </div>
  );
};

export default PlaygroundPage;
