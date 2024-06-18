export const InspectorWindow: React.FC<{}> = ({}) => {
  // const di = useCraftStore((state) => state.di);
  // const layout = useCraftStore((state) => state.layout);
  // const selectedNode = useMemo(() => di?.selectedNode, [di?.selectedNodeId]);

  // const handlePinTab = () => {
  //   if (!selectedNode) return;
  //   const tabset = layout.getActiveTabset()?.getId()!;
  //   layout.doAction(
  //     FlexLayout.Actions.addNode(
  //       {
  //         type: "tab",
  //         component: "inspectorNode",
  //         name: selectedNode.label,
  //         config: {
  //           nodeId: selectedNode.id,
  //         },
  //       },
  //       tabset,
  //       FlexLayout.DockLocation.CENTER,
  //       1,
  //     ),
  //   );
  // };

  return (
    <>
      {/* {selectedNode ? (
        <InspectorNode node={selectedNode} />
      ) : ( */}
      <div className="my-auto flex h-full w-full flex-1 flex-col items-center justify-center">
        <div className="border-spacing-3 border border-dashed  p-4 py-6 font-sans text-xl font-bold text-muted-foreground">
          Select a node to inspect
        </div>
      </div>
      {/* )} */}
    </>
  );
};
