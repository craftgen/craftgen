import { getWorkflow } from "../action";
import { Playground } from "./playground";
import "./rete.css";
import { CreateReleaseButton } from "./components/create-release-button";
// import { VersionHistory } from "./components/version-history";

const PlaygroundPage = async (props: {
  params: {
    projectSlug: string;
    playgroundSlug: string;
  };
}) => {
  const { data: workflow } = await getWorkflow({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.playgroundSlug,
    published: false,
  });
  if (!workflow) return <div>Not found</div>;
  return (
    <div>
      <div className="flex items-center w-full justify-end">
        <CreateReleaseButton
          playgroundId={workflow.id}
          version={workflow.currentVersion}
        />
        <span>
          {workflow.currentVersion !== 0 ? `v${workflow.currentVersion}` : null}
        </span>
        {/* <VersionHistory
          projectSlug={props.params.projectSlug}
          workflowSlug={props.params.playgroundSlug}
        /> */}
      </div>
      <Playground workflow={workflow} />
    </div>
  );
};

export default PlaygroundPage;
