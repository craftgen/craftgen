'use client';

import { useRete } from "rete-react-plugin";
import { createEditor } from "./editor";

export const Playground: React.FC<{ projectId: string }> = ({}) => {
  const [ref] = useRete(createEditor);

  return <div ref={ref} className="w-screen h-screen" />;
};
