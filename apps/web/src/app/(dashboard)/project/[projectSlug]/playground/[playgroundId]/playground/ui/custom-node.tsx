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
import { NodeTypes } from "../types";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
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

const { RefSocket, RefControl } = Presets.classic;

type NodeExtraData = { width?: number; height?: number; actor: AnyActorRef };

function sortByIndex<T extends [string, undefined | { index?: number }][]>(
  entries: T
) {
  entries.sort((a, b) => {
    const ai = a[1]?.index || 0;
    const bi = b[1]?.index || 0;

    return ai - bi;
  });
}

type Props<S extends ClassicScheme> = {
  data: S["Node"] & NodeExtraData;
  styles?: () => any;
  emit: RenderEmit<S>;
  store: ReteStoreInstance;
};
export type NodeComponent<Scheme extends ClassicScheme> = (
  props: Props<Scheme>
) => JSX.Element;

export function CustomNode<Scheme extends ClassicScheme>(props: Props<Scheme>) {
  const inputs = Object.entries(props.data.inputs);
  const outputs = Object.entries(props.data.outputs);
  const controls = Object.entries(props.data.controls);
  const selected = props.data.selected || false;
  const { id, label, width, height } = props.data;
  const { di, playgroundId, projectSlug, showControls, layout } = useStore(
    props.store
  );
  const [debug, SetDebug] = React.useState(false);

  sortByIndex(inputs);
  sortByIndex(outputs);
  sortByIndex(controls);

  const deleteNode = React.useCallback(async () => {
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
    const newNode = await createNode({
      di: di!,
      name: props.data.constructor.name as NodeTypes,
      data: props.data as any, //TODO:TYPE
      saveToDB: true,
      playgroundId,
      projectSlug,
    });
    await di?.editor.addNode(newNode);
    await di?.area.translate(newNode.id, di?.area.area.pointer);
  }, []);

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
      di?.engine?.execute(props.data.id);
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

  const state = useSelector(props.data.actor, (state) => state);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="relative">
          <Card
            className={cn(
              width && `w-[${width}px]`,
              height && `h-[${height}px]`,
              selected && " border-red-500",
              "flex flex-col flex-1 bg-muted"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{label}</CardTitle>
              <Button
                ref={ref}
                variant={"ghost"}
                size={"icon"}
                onClick={toggleDebug}
                className="absolute top-0 right-0"
              >
                <Wrench size={10} />
              </Button>
            </CardHeader>

            <CardContent className="flex-1">
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
            <div className="py-4">
              {/* Outputs */}
              {outputs.map(
                ([key, output]) =>
                  output && (
                    <div
                      className="text-right flex items-center justify-end"
                      key={key}
                      data-testid={`output-${key}`}
                    >
                      <Badge
                        className="translate-x-2"
                        data-testid="output-title"
                        variant={"default"}
                      >
                        {output?.label}
                      </Badge>
                      <div>
                        <RefSocket
                          name="output-socket"
                          side="output"
                          emit={props.emit}
                          socketKey={key}
                          nodeId={id}
                          payload={output.socket}
                        />
                      </div>
                    </div>
                  )
              )}
              {/* Inputs */}
              {inputs.map(
                ([key, input]) =>
                  input && (
                    <div
                      className="text-left flex items-center"
                      key={key}
                      data-testid={`input-${key}`}
                    >
                      <div>
                        <RefSocket
                          name="input-socket"
                          emit={props.emit}
                          side="input"
                          socketKey={key}
                          nodeId={id}
                          payload={input.socket}
                        />
                      </div>
                      {input && (!input.control || !input.showControl) && (
                        <Badge
                          className="-translate-x-2"
                          data-testid="input-title"
                          variant={"default"}
                        >
                          {input?.label}
                        </Badge>
                      )}
                      {input?.control && input?.showControl && (
                        <span className="input-control flex items-center">
                          <Badge
                            className="-translate-x-2"
                            variant={"secondary"}
                          >
                            {input.label}
                          </Badge>
                          <div className="mr-2">
                            <RefControl
                              key={key}
                              name="input-control"
                              emit={props.emit}
                              payload={input.control}
                            />
                          </div>
                        </span>
                      )}
                    </div>
                  )
              )}
            </div>
            <CardFooter>
              {debug && (
                <Badge
                  variant={"outline"}
                  className="font-mono text-muted hover:text-primary w-full"
                >
                  Id: {props.data.id}
                </Badge>
              )}
            </CardFooter>
          </Card>
          <div className="absolute">
            {debug && (
              <pre>
                <code>
                  {JSON.stringify(
                    {
                      state: state,
                      position: di?.area.nodeViews.get(props.data.id)?.position,
                    },
                    null,
                    2
                  )}
                </code>
              </pre>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
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
