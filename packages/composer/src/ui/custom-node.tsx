import * as React from "react";
import { useSelector } from "@xstate/react";
import * as FlexLayout from "flexlayout-react";
import {
  AlertCircle,
  CheckCircle,
  CheckSquare,
  Cog,
  Copy,
  Loader2,
  Play,
  Undo2,
} from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { Resizable } from "react-resizable";
import { useCopyToClipboard, useDebounce, useMeasure } from "react-use";
import { Key } from "ts-key-enum";

import type { Schemes } from "@craftgen/core/types";
import { Badge } from "@craftgen/ui/components/badge";
import { Button } from "@craftgen/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@craftgen/ui/components/card";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@craftgen/ui/components/context-menu";
import { Input } from "@craftgen/ui/components/input";
import { Separator } from "@craftgen/ui/components/separator";
import { cn } from "@craftgen/ui/lib/utils";

import { Drag, Presets, type RenderEmit } from "../plugins/reactPlugin";
import type { ReteStoreInstance } from "../store";

import "react-resizable/css/styles.css";

import { useState } from "react";
import { get, isEqual, isNil } from "lodash-es";
import Markdown from "react-markdown";
import JsonView from "react18-json-view";
import { AnyActorRef } from "xstate";

import { Icons } from "@craftgen/ui/components/icons";
import { JSONView } from "@craftgen/ui/components/json-view";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@craftgen/ui/components/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@craftgen/ui/components/tooltip";

// import { updateNodeMetadata } from "@/actions/update-node-meta";

const { RefSocket, RefControl } = Presets.classic;

function sortByIndex<T extends [string, undefined | { index?: number }][]>(
  entries: T,
) {
  entries.sort((a, b) => {
    const ai = a[1]?.index || 0;
    const bi = b[1]?.index || 0;

    return ai - bi;
  });
}

interface Props<S extends Schemes> {
  data: S["Node"];
  styles?: () => any;
  emit: RenderEmit<S>;
  store: ReteStoreInstance;
}
export type NodeComponent = (props: Props<Schemes>) => JSX.Element;

export function CustomNode(props: Props<Schemes>) {
  return <Node {...props} />;
}

export const Node = (props: Props<Schemes>) => {
  const inputs = Object.entries(props.data.inputs);
  const outputs = Object.entries(props.data.outputs);
  const controls = Object.entries(props.data.controls);
  const selected = props.data.selected || false;
  const { id, di } = props.data;

  sortByIndex(inputs);
  sortByIndex(outputs);
  sortByIndex(controls);

  const deleteNode = React.useCallback(async () => {
    if (di.executionId) {
      alert("Cannot delete node in execution");
      return;
    }

    const connections =
      di?.editor.getConnections().filter((c) => {
        return c.source === props.data.id || c.target === props.data.id;
      }) || [];
    for (const connection of connections) {
      await di?.editor.removeConnection(connection.id);
    }
    await di?.editor.removeNode(props.data.id);
  }, [props.data]);

  const cloneNode = React.useCallback(async () => {
    console.log("clone node", {
      data: props.data,
      name: props.data.ID,
      state: props.data.actor.getSnapshot(),
    });
    const rawState = JSON.stringify(props.data.actor.getSnapshot());
    console.log({ rawState });

    const node = await di.duplicateNode(props.data.id);
    await di?.editor.addNode(node);
    await di?.area?.translate(node.id, di?.area?.area.pointer);
  }, []);

  const triggerNode = async () => {
    alert("Triggering node");
    // await di.runSync({
    //   inputId: props.data.id,
    // });
  };

  const pinNode = React.useCallback(async () => {
    const layout = props.store.getState().layout;
    const tabset = layout.getActiveTabset()?.getId()!;
    layout.doAction(
      FlexLayout.Actions.addNode(
        {
          type: "tab",
          component: "inspectorNode",
          name: props.data.label,
          config: {
            nodeId: props.data.id,
          },
        },
        tabset,
        FlexLayout.DockLocation.CENTER,
        1,
      ),
    );
  }, []);

  useHotkeys<HTMLDivElement>(
    `${Key.Backspace}, ${Key.Delete}`,
    async () => {
      await deleteNode();
    },
    {
      enabled: selected,
    },
  );
  useHotkeys<HTMLDivElement>(
    `${Key.Meta}+d`,
    async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await cloneNode();
    },
    {
      enabled: selected,
    },
  );

  useHotkeys<HTMLDivElement>(
    `${Key.Meta}+${Key.Enter}`,
    async (event) => {
      triggerNode();
    },
    {
      enabled: selected,
    },
  );

  const ref = React.useRef<HTMLButtonElement>(null);
  Drag.useNoDrag(ref);
  const ref2 = React.useRef<HTMLButtonElement>(null);
  Drag.useNoDrag(ref2);

  const stateValue = useSelector(
    props.data.actor,
    (state) => state?.value,
    isEqual,
  );

  const NodeIcon = React.useMemo(() => {
    const iconName = props.data.di.nodeMeta.get(props.data.ID)?.icon;
    if (!iconName) return Icons.component;
    return Icons[iconName as keyof typeof Icons];
  }, []);
  const [editLabel, setEditLabel] = React.useState(false);
  const [size, setSize] = useState({
    width: props.data.width,
    height: props.data.height,
  });

  useHotkeys(
    `${Key.Meta}+r`,
    (e) => {
      setEditLabel(!editLabel);
    },
    {
      enabled: props.data.di.selectedNodeId === props.data.id,
      preventDefault: true,
    },
  );
  const [internalRef, internal] = useMeasure<HTMLDivElement>();

  useDebounce(
    () => {
      setSize({
        height: internal.height + 20,
        width: size.width,
      });
    },
    10,
    [internal.height],
  );

  useDebounce(
    () => {
      const { width, height } = size;
      const { data } = props;

      if (width > 0 || height > 0) {
        if (data.width !== width || data.height !== height) {
          di?.area?.resize(data.id, width, height);
        }
      }
    },
    100,
    [size],
  );

  useDebounce(
    async () => {
      if (props.data.label !== props.data.nodeData.label) {
        throw new Error("Not implemented");
        // await updateNodeMetadata({
        //   id: props.data.id,
        //   label: props.data.label,
        // });
      }
    },
    1000,
    [props.data.label],
  );
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.data.setLabel(e.target.value);
  };

  return (
    <TooltipProvider>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Resizable
            data-nodetype={props.data.ID}
            width={size.width}
            height={size.height}
            handle={<ResizeHandle />}
            onResize={(e, { size }) => {
              setSize(size);
            }}
            minConstraints={[240, internal.height + 20]}
            maxConstraints={[1000, 1000]}
          >
            <Card
              style={{
                width: size.width,
                height: size.height,
              }}
              className={cn(
                "group rounded-lg @container",
                selected && " border-primary",
                "glass flex flex-1 flex-col",
                stateValue === "loading" &&
                  "animate-pulse border-2 border-blue-300",
                stateValue === "running" && "border-yellow-300",
                stateValue === "action_required" && "border-yellow-300/40",
                stateValue === "error" && "border-2 border-red-600",
              )}
            >
              <div ref={internalRef} className="flex flex-col justify-between">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2 py-1">
                  <div className="flex items-center space-x-2">
                    <NodeIcon className="h-5 w-5" />
                    {editLabel ? (
                      <Input
                        defaultValue={props.data.label}
                        autoFocus
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            setEditLabel(false);
                          }
                        }}
                        onChange={handleLabelChange}
                      />
                    ) : (
                      <Drag.NoDrag>
                        <CardTitle
                          className="flex"
                          onDoubleClick={() => {
                            setEditLabel(true);
                          }}
                        >
                          {props.data.label}{" "}
                          {props.data.action ? (
                            <span className="ml-2 text-sm text-muted-foreground">
                              {"/"}
                              {props.data.action}
                            </span>
                          ) : null}
                        </CardTitle>
                      </Drag.NoDrag>
                    )}
                  </div>
                  <div className="flex">
                    <Button
                      ref={ref2}
                      onClick={triggerNode}
                      // disabled={!state.matches("idle")}
                      variant={"ghost"}
                      size="icon"
                    >
                      {/* {JSON.stringify(stateValue, null, 2)} */}
                      {stateValue === "editing" && (
                        <Cog
                          className="animate-spin text-muted-foreground"
                          size={14}
                        />
                      )}
                      {stateValue === "running" && (
                        <Loader2
                          size={14}
                          className="animate-spin text-green-400"
                        />
                      )}
                      {stateValue === "action_required" && (
                        <AlertCircle size={14} className="text-yellow-400" />
                      )}
                      {stateValue === "idle" && <Play size={14} />}
                      {stateValue === "complete" && (
                        <CheckCircle size={14} className="text-green-400" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <div className="grid grid-cols-2 py-4">
                  <NodeInputs node={props.data} emit={props.emit} />
                  <NodeOutputs node={props.data} emit={props.emit} />
                </div>
                <CardContent className="flex-1">
                  {/* controls */}
                  <section
                    className={cn(
                      "hidden",
                      size.height > props.data.minHeightForControls &&
                        "my-2 space-y-2 @xs:block",
                    )}
                  >
                    {inputs.map(
                      ([key, input]) =>
                        input?.control &&
                        input?.definition["x-showSocket"] && (
                          <div className="flex flex-col space-y-1" key={key}>
                            {/* <Label
                                                htmlFor={input.control.id}
                                                className="capitalize"
                                              >
                                                {key}
                                              </Label> */}
                            <Drag.NoDrag>
                              <RefControl
                                key={key}
                                name="control"
                                emit={props.emit}
                                payload={input.control}
                              />
                            </Drag.NoDrag>
                          </div>
                        ),
                    )}
                    {controls.map(([key, control]) => {
                      return control ? (
                        <div className="flex flex-col space-y-1" key={key}>
                          {/* <Label htmlFor={control.id} className="capitalize">
                                              {key}
                                            </Label> */}
                          <Drag.NoDrag>
                            <RefControl
                              key={key}
                              name="control"
                              emit={props.emit}
                              payload={control}
                            />
                          </Drag.NoDrag>
                        </div>
                      ) : null;
                    })}
                  </section>
                </CardContent>
                <Drag.NoDrag>
                  <CardFooter className="mx-2 my-2 mt-auto flex flex-col  rounded p-1 px-2 ">
                    {/* <NodeOutput id={props.data.id} actor={props.data.actor} /> */}
                    <NodeIdBadge id={props.data.id} />
                  </CardFooter>
                </Drag.NoDrag>
              </div>
            </Card>
          </Resizable>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={cloneNode}>
            Clone
            <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={pinNode}>Pin</ContextMenuItem>
          <ContextMenuItem onClick={() => setEditLabel(true)}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={deleteNode}>
            Delete
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>Controllers</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuCheckboxItem checked>
                Show Bookmarks Bar
                <ContextMenuShortcut>⌘⇧B</ContextMenuShortcut>
              </ContextMenuCheckboxItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </TooltipProvider>
  );
};

const NodeOutputs = ({
  node,
  emit,
}: {
  node: Schemes["Node"];
  emit: RenderEmit<Schemes>;
}) => {
  const outputSockets = useSelector(
    node.nodeActor,
    (state) =>
      Object.entries(
        Object.values(state.context.actors)
          .map((actor) => actor.outputSockets)
          .reduce((acc, val) => ({ ...acc, ...val }), {}) || {},
      ).filter(([key, socket]) => node.outputs[key]),
    (a, b) =>
      isEqual(
        a.map(([k, v]) => k),
        b.map(([k, v]) => k),
      ),
  );

  return (
    <div>
      {/* Outputs */}
      {outputSockets.map(([key, socketActor]) => (
        <RenderOutput
          key={`output-${node.id}-${key}`}
          emit={emit}
          outputKey={key}
          actor={socketActor}
          output={node.outputs[key]}
          id={node.id}
        />
      ))}
    </div>
  );
};

const NodeInputs = ({
  node,
  emit,
}: {
  node: Schemes["Node"];
  emit: RenderEmit<Schemes>;
}) => {
  const inputSockets = useSelector(
    node.nodeActor,
    (state) =>
      Object.entries(
        Object.values(state.context.actors)
          .map((actor) => actor.inputSockets)
          .reduce((acc, val) => ({ ...acc, ...val }), {}) || {},
      ).filter(([key, socket]) => node.inputs[key]),
    (a, b) =>
      isEqual(
        a.map(([k, v]) => k),
        b.map(([k, v]) => k),
      ),
  );

  return (
    <div>
      {/* Inputs */}
      {inputSockets?.map(([key, socketActor]) => (
        <RenderInput
          key={`input-${node.id}-${key}`}
          emit={emit}
          inputKey={key}
          input={node.inputs[key]}
          actor={socketActor}
          id={node.id}
        />
      ))}
    </div>
  );
};

const NodeOutput = ({ id, actor }: { id: string; actor: AnyActorRef }) => {
  const outputs = useSelector(actor, (state) => state.context.outputs, isEqual);

  return (
    <div>
      {/* {outputs?.value && (
        <div className="break-words overflow-clip">
          <Markdown>{String(outputs?.value)}</Markdown>
        </div>
      )} */}
      {outputs?.result && outputs?.result[0] && (
        <img src={outputs?.result[0]} className="w-full" />
      )}
    </div>
    // <Tabs defaultValue="JSON" className="w-full">
    //   <TabsList className="w-full">
    //     <Drag.NoDrag>
    //       <TabsTrigger value="Output">Output</TabsTrigger>
    //     </Drag.NoDrag>
    //     <Drag.NoDrag>
    //       <TabsTrigger value="JSON">JSON</TabsTrigger>
    //     </Drag.NoDrag>
    //   </TabsList>
    //   <TabsContent value="Output">
    //   </TabsContent>
    //   <TabsContent value="JSON">
    //     <JSONView src={outputs} />
    //   </TabsContent>
    // </Tabs>
  );
};

const NodeIdBadge: React.FC<{ id: string }> = ({ id }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    copyToClipboard(id);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  const [copyToClipboardState, copyToClipboard] = useCopyToClipboard();

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant={"outline"}
          className="cursor-pointer truncate font-mono text-xs text-muted group-hover:text-primary"
          onClick={handleCopy}
        >
          {id}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className={cn(copied && "bg-green-500")}>
        <span className="flex">
          Copy ID
          {copied ? (
            <CheckSquare className="ml-1  h-4 w-4 " />
          ) : (
            <Copy className="ml-1  h-4 w-4" />
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  );
};

const ResizeHandle = React.forwardRef<any>((props: any, ref: any) => {
  const { handleAxis, ...restProps } = props;
  Drag.useNoDrag(ref);
  return (
    <div
      ref={ref}
      className={`-m-2 hidden h-10 w-10 active:-m-32 active:h-full  active:w-full  active:bg-none group-hover:block  react-resizable-handle-${handleAxis} react-resizable-handle`}
      {...restProps}
    ></div>
  );
});
ResizeHandle.displayName = "ResizeHandle";

const RenderInput: React.FC<any> = ({ emit, id, inputKey, actor, input }) => {
  const isVisible = useSelector(
    actor,
    (state) => get(state, ["context", "definition", "x-showSocket"], false),
    isEqual,
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="flex select-none items-center text-left "
      data-testid={`input-${inputKey}`}
    >
      <RefSocket
        name="input-socket"
        emit={emit}
        side="input"
        socketKey={inputKey}
        nodeId={id}
        payload={{ socket: input?.socket, input } as any}
      />
    </div>
  );
};

const RenderOutput: React.FC<any> = ({
  emit,
  id,
  outputKey,
  actor,
  output,
}) => {
  const isVisible = useSelector(
    actor,
    (state) => get(state, ["context", "definition", "x-showSocket"], false),
    isEqual,
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="flex select-none items-center justify-end text-right"
      data-testid={`output-${outputKey}`}
    >
      {
        <RefSocket
          name="output-socket"
          side="output"
          emit={emit}
          socketKey={outputKey}
          nodeId={id}
          payload={{ socket: output?.socket, output } as any}
        />
      }
    </div>
  );
};
