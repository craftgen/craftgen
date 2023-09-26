import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ClassicScheme, RenderEmit, Presets, Drag } from "rete-react-plugin";
import { createNode } from "../io";
import { Key } from "ts-key-enum";
import { Schemes, nodesMeta } from "../types";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Wrench } from "lucide-react";
import { AnyActorRef } from "xstate";
import { useSelector } from "@xstate/react";
import { useStore } from "zustand";
import { ReteStoreInstance } from "../store";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import * as FlexLayout from "flexlayout-react";
import { SocketNameType, useSocketConfig } from "../sockets";
import { useDebounce, useMeasure, useMouse } from "react-use";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { ToastAction } from "@/components/ui/toast";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import { useState } from "react";

const { RefSocket, RefControl } = Presets.classic;

type NodeExtraData = {
  width?: number;
  height?: number;
  actor: AnyActorRef;
  action?: string;
};

function sortByIndex<T extends [string, undefined | { index?: number }][]>(
  entries: T
) {
  entries.sort((a, b) => {
    const ai = a[1]?.index || 0;
    const bi = b[1]?.index || 0;

    return ai - bi;
  });
}

type Props<S extends Schemes> = {
  data: S["Node"] & NodeExtraData;
  styles?: () => any;
  emit: RenderEmit<S>;
  store: ReteStoreInstance;
};
export type NodeComponent = (props: Props<Schemes>) => JSX.Element;

export function CustomNode<Scheme extends ClassicScheme>(
  props: Props<Schemes>
) {
  const inputs = Object.entries(props.data.inputs);
  const outputs = Object.entries(props.data.outputs);
  const controls = Object.entries(props.data.controls);
  const selected = props.data.selected || false;
  const { id, label, width, height } = props.data;

  const {
    di,
    playgroundId,
    projectSlug,
    showControls,
    layout,
    setSelectedNodeId,
  } = useStore(props.store);
  const [debug, SetDebug] = React.useState(false);

  sortByIndex(inputs);
  sortByIndex(outputs);
  sortByIndex(controls);

  const deleteNode = React.useCallback(async () => {
    setSelectedNodeId(null);
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
    const newNode = await createNode({
      di: di!,
      type: props.data.ID,
      data: {
        ...props.data,
        state: JSON.parse(rawState),
      } as any, //TODO:TYPE
      saveToDB: true,
      playgroundId,
      projectSlug,
    });
    await di?.editor.addNode(newNode);
    await di?.area?.translate(newNode.id, di?.area?.area.pointer);
  }, []);

  const triggerNode = async () => {
    di?.engine?.execute(props.data.id);
  };

  const pinNode = React.useCallback(async () => {
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
        1
      )
    );
  }, []);

  useHotkeys<HTMLDivElement>(
    `${Key.Backspace}, ${Key.Delete}`,
    async () => {
      await deleteNode();
    },
    {
      enabled: selected,
    }
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
    }
  );

  useHotkeys<HTMLDivElement>(
    `${Key.Meta}+${Key.Enter}`,
    async (event) => {
      triggerNode();
    },
    {
      enabled: selected,
    }
  );

  const toggleDebug = () => {
    SetDebug(!debug);
  };
  const ref = React.useRef<HTMLButtonElement>(null);
  Drag.useNoDrag(ref);
  const ref2 = React.useRef<HTMLButtonElement>(null);
  Drag.useNoDrag(ref2);

  const state = useSelector(props.data.actor, (state) => state);

  const { toast } = useToast();
  React.useEffect(() => {
    const subs = props.data.actor.subscribe((state) => {
      if (state.matches("error")) {
        if (state.context.error.name === "MISSING_API_KEY_ERROR") {
          toast({
            title: "Error",
            description: state.context.error.message,
            action: (
              <Link href={`/project/${projectSlug}/settings/tokens`}>
                <ToastAction altText={"go to settings"}>
                  {/* <Button size="sm">Go to Settings</Button> */}
                  Go to Settings
                </ToastAction>
              </Link>
            ),
          });
        } else {
          toast({
            title: "Error",
            description: state.context.error.message,
          });
        }
      }
    });
    return subs.unsubscribe;
  }, []);
  const NodeIcon = React.useMemo(() => {
    return nodesMeta[props.data.ID].icon;
  }, []);
  const [editLabel, setEditLabel] = React.useState(false);
  const [size, setSize] = useState({
    width: props.data.width,
    height: props.data.height,
  });

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
    1000,
    [size]
  );

  return (
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
          minConstraints={[200, 200]}
        >
          <Card
            style={{
              width: size.width,
              height: size.height,
            }}
            className={cn(
              "group",
              selected && " border-primary",
              "flex flex-col flex-1 bg-background ",
              state.matches("loading") &&
                "border-blue-300 border-2 animate-pulse",
              state.matches("running") && "border-green-300",
              state.matches("error") && "border-red-600 border-2"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between py-1 px-2 space-y-0">
              <div className="flex space-x-2 items-center">
                <NodeIcon className="w-5 h-5" />
                {editLabel ? (
                  <Input
                    value={label}
                    onChange={(v) => console.log(v.bubbles)}
                  />
                ) : (
                  <Drag.NoDrag>
                    <CardTitle
                      className="flex"
                      onDoubleClick={() => {
                        console.log("double click");
                        setEditLabel(true);
                      }}
                    >
                      {label}{" "}
                      {props.data.action ? (
                        <span className="text-muted-foreground ml-2 text-sm">
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
                  ref={ref}
                  variant={"ghost"}
                  size={"icon"}
                  onClick={toggleDebug}
                >
                  <Wrench size={14} />
                </Button>
                <Button
                  ref={ref2}
                  onClick={triggerNode}
                  variant={"ghost"}
                  size="icon"
                >
                  {state.matches("running") ? (
                    <Loader2
                      size={14}
                      className="animate-spin text-green-400"
                    />
                  ) : (
                    <Play size={14} />
                  )}
                </Button>
              </div>
            </CardHeader>
            <Separator />

            <CardContent className="flex-1" onDoubleClick={pinNode}>
              {/* controls */}
              {showControls &&
                controls.map(([key, control]) => {
                  return control ? (
                    <RefControl
                      key={key}
                      name="control"
                      emit={props.emit}
                      payload={control}
                    />
                  ) : null;
                })}
            </CardContent>
            <div className="py-4 grid-cols-2 grid">
              <div>
                {/* Inputs */}
                {inputs.map(([key, input]) => {
                  if (!input) return null;
                  return (
                    <RenderInput
                      emit={props.emit}
                      input={input}
                      key={`input-key-${key}`}
                      inputKey={key}
                      id={id}
                    />
                  );
                })}
              </div>
              <div>
                {/* Outputs */}
                {outputs.map(([key, output]) => {
                  if (!output) return null;
                  return (
                    <RenderOutput
                      emit={props.emit}
                      output={output}
                      key={`output-key-${key}`}
                      outputKey={key}
                      id={id}
                    />
                  );
                })}
              </div>
            </div>
            <CardFooter className="p-1 px-2 pt-0">
              <Badge
                variant={"outline"}
                className="font-mono text-muted group-hover:text-primary w-full text-xs truncate"
              >
                {props.data.id}
              </Badge>
            </CardFooter>
          </Card>
        </Resizable>
      </ContextMenuTrigger>
      {debug && (
        <div className="absolute">
          <pre>
            <code>
              {JSON.stringify(
                {
                  state: state,
                  size: props.data.size,
                },
                null,
                2
              )}
            </code>
          </pre>
        </div>
      )}
      <ContextMenuContent>
        <ContextMenuItem onClick={cloneNode}>
          Clone
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={pinNode}>Pin</ContextMenuItem>
        <ContextMenuItem onClick={deleteNode}>
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

const ResizeHandle = React.forwardRef<any>((props: any, ref: any) => {
  const { handleAxis, ...restProps } = props;
  Drag.useNoDrag(ref);
  return (
    <div
      ref={ref}
      className={`w-10 h-10 active:w-full active:h-full active:-m-32  active:bg-none  hidden group-hover:block  react-resizable-handle-${handleAxis} react-resizable-handle`}
      {...restProps}
    ></div>
  );
});
ResizeHandle.displayName = "ResizeHandle";

const RenderInput: React.FC<any> = ({ input, emit, id, inputKey }) => {
  const config = useSocketConfig(input?.socket?.name as SocketNameType);
  return (
    <div
      className="text-left flex items-center select-none "
      data-testid={`input-${inputKey}`}
    >
      <div>
        <RefSocket
          name="input-socket"
          emit={emit}
          side="input"
          socketKey={inputKey}
          nodeId={id}
          payload={input.socket}
        />
      </div>
      {input && (
        <Badge
          className={cn("-translate-x-2", config?.badge)}
          data-testid="input-title"
          variant={"default"}
        >
          {input?.label}
        </Badge>
      )}
      {/* {input?.control && input?.showControl && (
        <span className="input-control flex items-center ">
          <Badge className="-translate-x-2" variant={"secondary"}>
            {input.label}
          </Badge>
          <div className="mr-2">
            <RefControl
              key={inputKey}
              name="input-control"
              emit={emit}
              payload={input.control}
            />
          </div>
        </span>
      )} */}
    </div>
  );
};

const RenderOutput: React.FC<any> = ({ output, emit, id, outputKey }) => {
  const config = useSocketConfig(output?.socket?.name as SocketNameType);
  return (
    <div
      className="text-right flex items-center justify-end select-none"
      data-testid={`output-${outputKey}`}
    >
      <Badge
        className={cn("translate-x-2", config?.badge)}
        data-testid="output-title"
        variant={"default"}
      >
        {output?.label}
      </Badge>
      <div>
        <RefSocket
          name="output-socket"
          side="output"
          emit={emit}
          socketKey={outputKey}
          nodeId={id}
          payload={output?.socket!}
        />
      </div>
    </div>
  );
};
