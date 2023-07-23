import { getPlayground } from "./action";
import "./flow.css";
import { Playground } from "./playground";

export default async function Home(props: {
  params: {
    projectSlug: string;
    playgroundId: string;
  };
}) {
  const playground = await getPlayground({ playgroundId: props.params.playgroundId });

  return (
    <main className="w-screen h-[calc(100vh-4rem)]">
      <Playground playground={playground} />
    </main>
  );
}
