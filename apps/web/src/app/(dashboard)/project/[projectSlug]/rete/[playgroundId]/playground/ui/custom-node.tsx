import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import * as React from "react";
import { ClassicScheme, RenderEmit, Presets } from "rete-react-plugin";

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

  console.log(props, typeof props.data,)

  return (
    <div
      className={cn(
        "bg-accent rounded  border-2 border-gray-500 cursor-pointer box-border pb-2 select-none hover:bg-muted shadow-md ",
        selected && "border-2 border-red-500",
        width && `w-[${width}px]`,
        height && `h-[${height}px]`
      )}
      data-testid="node"
    >
      <div className="flex flex-col p-2">
        <Label data-testid="title" className="w-full">
          {label}
        </Label>
        <div className="py-2">
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
        </div>
      </div>
      {/* Outputs */}
      {outputs.map(
        ([key, output]) =>
          output && (
            <div className="text-right" key={key} data-testid={`output-${key}`}>
              <div
                className="align-middle inline-block"
                data-testid="output-title"
              >
                {output?.label}
              </div>
              <RefSocket
                name="output-socket"
                side="output"
                emit={props.emit}
                socketKey={key}
                nodeId={id}
                payload={output.socket}
              />
            </div>
          )
      )}
      {/* Inputs */}
      {inputs.map(
        ([key, input]) =>
          input && (
            <div className="text-left" key={key} data-testid={`input-${key}`}>
              <RefSocket
                name="input-socket"
                emit={props.emit}
                side="input"
                socketKey={key}
                nodeId={id}
                payload={input.socket}
              />
              {input && (!input.control || !input.showControl) && (
                <div
                  className="align-middle inline-block"
                  data-testid="input-title"
                >
                  {input?.label}
                </div>
              )}
              {input?.control && input?.showControl && (
                <span className="input-control">
                  <RefControl
                    key={key}
                    name="input-control"
                    emit={props.emit}
                    payload={input.control}
                  />
                </span>
              )}
            </div>
          )
      )}
    </div>
  );
}
