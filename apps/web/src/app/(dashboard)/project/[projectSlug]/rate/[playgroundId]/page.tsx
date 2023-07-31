import { getPlayground } from "./action";
import { Playground } from "./playground";
import "./rete.css";

const PlaygroundPage = async (props: {
  params: {
    projectSlug: string;
    playgroundId: string;
  };
}) => {
  const playground = await getPlayground({
    playgroundId: props.params.playgroundId,
  });
  if (!playground) return <div>Not found</div>;
  return (
    <div>
      <h1>Playground</h1>
      <Playground playground={playground} />
    </div>
  );
};

export default PlaygroundPage;
