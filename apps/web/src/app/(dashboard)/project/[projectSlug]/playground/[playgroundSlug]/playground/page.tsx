import { getPlayground } from "../action";
import { Playground } from "./playground";
import "./rete.css";

const PlaygroundPage = async (props: {
  params: {
    projectSlug: string;
    playgroundSlug: string;
  };
}) => {
  const playground = await getPlayground({
    projectSlug: props.params.projectSlug,
    playgroundSlug: props.params.playgroundSlug,
  });
  if (!playground) return <div>Not found</div>;
  return (
    <div>
      <Playground playground={playground} />
    </div>
  );
};

export default PlaygroundPage;
