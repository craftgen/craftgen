import { getPlayground } from "./action";
import { Playground } from "./playground";
import "./rete.css";

const PlaygroundPage = async (props: {
  params: {
    projectSlug: string;
    playgroundSlug: string;
  };
}) => {
  const playground = await getPlayground({
    playgroundSlug: props.params.playgroundSlug,
  });
  if (!playground) return <div>Not found</div>;
  return (
    <div>
      <h1 className="text-2xl">
        {playground.name} - {playground.slug}
      </h1>
      <p>{playground.description}</p>
      {/* <Playground playground={playground} /> */}
    </div>
  );
};

export default PlaygroundPage;
