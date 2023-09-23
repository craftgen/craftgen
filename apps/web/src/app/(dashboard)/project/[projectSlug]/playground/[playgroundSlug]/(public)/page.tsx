import { getPlayground } from "../action";

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
  return (
    <div className="h-full flex flex-col">
      <section className="grid grid-cols-2 divide-x ">
        <div className="p-2">
          <h2>Input
          </h2>
        </div>
        <div className="p-2">
          <h2>Output</h2>
        </div>
      </section>
    </div>
  );
};

export default PlaygroundPage;
