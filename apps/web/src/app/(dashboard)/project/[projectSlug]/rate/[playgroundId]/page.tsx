import { Playground } from "./playground";
import './rete.css'


const PlaygroundPage = (props: {
  params: {
    projectSlug: string;
    playgroundId: string;
  };
}) => {
  return (
    <div>
      <h1>Playground</h1>
      <Playground projectId={props.params.playgroundId} />
    </div>
  );
};

export default PlaygroundPage;
