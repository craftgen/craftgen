import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ClassicScheme, RenderEmit, Presets } from "rete-react-plugin";
import { DiContainer } from "../editor";
import { createNode } from "../io";
import { Key } from "ts-key-enum";

const { RefSocket, RefControl } = Presets.classic;

type NodeExtraData = { width?: number; height?: number };

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
  di: DiContainer;
  data: S["Node"] & NodeExtraData;
  styles?: () => any;
  emit: RenderEmit<S>;
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

  sortByIndex(inputs);
  sortByIndex(outputs);
  sortByIndex(controls);

  console.log(props, typeof props.data);
  const deleteNode = React.useCallback(async () => {
    const connections =
      props.di.editor.getConnections().filter((c) => {
        return c.source === props.data.id || c.target === props.data.id;
      }) || [];
    for (const connection of connections) {
      await props.di?.editor.removeConnection(connection.id);
    }
    await props.di?.editor.removeNode(props.data.id);
  }, [props.data]);

  const cloneNode = React.useCallback(async () => {
    const newNode = await createNode(
      props.di!,
      props.data.constructor.name,
      props.data
    );
    props.di.editor.addNode(newNode);
    props.di?.area.translate(newNode.id, props?.di?.area.area.pointer);
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
      console.log("running");
      await cloneNode();
    },
    {
      enabled: selected,
    }
  );

  useHotkeys<HTMLDivElement>(
    `${Key.Meta}+${Key.Enter}`,
    async (event) => {
      props.di.engine?.execute(props.data.id);
    },
    {
      enabled: selected,
    }
  );

  return (
    <Card
      className={cn(
        width && `w-[${width}px]`,
        height && `h-[${height}px]`,
        selected && " border-red-500"
      )}
    >
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* controls */}
        {controls.map(([key, control]) => {
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
                  variant={"secondary"}
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
                    variant={"secondary"}
                  >
                    {input?.label}
                  </Badge>
                )}
                {input?.control && input?.showControl && (
                  <span className="input-control flex items-center">
                    <Badge className="-translate-x-2" variant={"secondary"}>
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
    </Card>
  );
}
