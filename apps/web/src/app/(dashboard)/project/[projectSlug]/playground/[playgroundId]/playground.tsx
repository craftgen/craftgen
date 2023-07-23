"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowInstance,
  Panel,
  Node,
  ReactFlowProvider,
  XYPosition,
} from "reactflow";
import useStore from "./state";
import { debounce } from "lodash-es";
import { createNode, getPlayground, savePlayground } from "./action";
import { useParams } from "next/navigation";
import { Toolbar } from "./toolbar";
import { nodeTypes } from "./nodes";

export const Playground: React.FC<{
  playground: NonNullable<Awaited<ReturnType<typeof getPlayground>>>;
}> = ({ playground }) => {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    liveblocks: { enterRoom, leaveRoom, isStorageLoading },
  } = useStore();

  const params = useParams();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const saveDebounced = debounce(
    (state) =>
      savePlayground({
        projectSlug: params.projectSlug as string,
        playgroundId: params.playgroundId as string,
        nodes: state.nodes,
        edges: state.edges,
      }),
    2000
  );
  useEffect(() => {
    setEdges(playground.edges!);
    setNodes(playground.nodes!);
    const listener = useStore.subscribe((state) => {
      if (state.nodes.length === 0) {
        console.log("SAVING PLAYGROUND", { state });
      }
      saveDebounced(state);
    });
    return () => {
      listener();
      saveDebounced.cancel();
    };
  }, []);

  const roomId = playground.id;
  // Enter the Liveblocks room on load
  useEffect(() => {
    enterRoom(roomId);
    return () => leaveRoom(roomId);
  }, [enterRoom, leaveRoom, roomId]);

  const nodeTypesMem = useMemo(() => nodeTypes, []);

  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
    any,
    any
  > | null>(null);

  // const addNode = async () => {
  //   if (!rfInstance) return;
  //   const node = await createNode({
  //     projectSlug: params.projectSlug as string,
  //     playgroundId: params.playgroundId as string,
  //     type,
  //   });
  //   const newNode: Node = {
  //     id: node.id,
  //     type: node.type,
  //     data: node.data,
  //     position: {
  //       x: Math.random() * window.innerWidth - 100,
  //       y: Math.random() * window.innerHeight,
  //     },
  //   };
  //   rfInstance.addNodes([newNode]);
  // };

  const onDrop = useCallback(
    async (event) => {
      event.preventDefault();

      const reactFlowBounds =
        reactFlowWrapper?.current!.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      // check if the dropped element is valid
      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = rfInstance?.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const node = await createNode({
        projectSlug: params.projectSlug as string,
        playgroundId: params.playgroundId as string,
        type,
      });
      const newNode: Node = {
        id: node.id,
        type: node.type,
        data: node.state,
        position: position as XYPosition,
      };
      rfInstance?.addNodes([newNode]);
    },
    [rfInstance]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  if (isStorageLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <img src="https://liveblocks.io/loading.svg" alt="Loading" />
      </div>
    );
  }
  return (
    <div className="relative w-full h-full">
      <ReactFlowProvider>
        <div className="reactflow-wrapper w-full h-full" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypesMem}
            snapToGrid
            snapGrid={[15, 15]}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onConnect={onConnect}
            onInit={setRfInstance}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
        <Toolbar />
      </ReactFlowProvider>
    </div>
  );
};
