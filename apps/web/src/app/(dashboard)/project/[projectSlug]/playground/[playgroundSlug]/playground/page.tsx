import { getWorkflow } from "../action";
import { Playground } from "./playground";
import "./rete.css";
import { CreateReleaseButton } from "./components/create-release-button";

const PlaygroundPage = async (props: {
  params: {
    projectSlug: string;
    playgroundSlug: string;
  };
}) => {
  const { data: playground } = await getWorkflow({
    projectSlug: props.params.projectSlug,
    workflowSlug: props.params.playgroundSlug,
  });
  if (!playground) return <div>Not found</div>;
  return (
    <div>
      <div className="flex items-center w-full justify-end">
        <CreateReleaseButton
          playgroundId={playground.id}
          nextVersion={playground.version + 1}
        />
        <span>
          {playground.version === 0 ? "Latest" : `v${playground.version}`}
        </span>
      </div>
      <Playground playground={playground} />
    </div>
  );
};

export default PlaygroundPage;
