import { getPlayground } from "../action";
import { ModuleHeader } from "../components/module-header";

const PlaygroundPage = async (props: {
  params: {
    projectSlug: string;
    playgroundSlug: string;
  };
}) => {
  // TODO: make amount we fetch configurable
  const playground = await getPlayground({
    projectSlug: props.params.projectSlug,
    playgroundSlug: props.params.playgroundSlug,
  });
  if (!playground) return <div>Not found</div>;
  return <div>DEMO</div>;
};

export default PlaygroundPage;
