import { useSelector } from "@xstate/react";
import { AnyActorRef } from "xstate";

import { NodeProps } from "@craftgen/core/types";
import { Badge } from "@craftgen/ui/components/badge";
import { Button } from "@craftgen/ui/components/button";
import { Icons } from "@craftgen/ui/components/icons";
import { JSONView } from "@craftgen/ui/components/json-view";
import { Label } from "@craftgen/ui/components/label";
import { cn } from "@craftgen/ui/lib/utils";

import { useCraftStore } from "../use-store";

export const Runs = ({ node }: { node: NodeProps }) => {
  const di = useCraftStore((state) => state.di);
  const runs = useSelector(di?.actor!, (state) =>
    Object.entries(state.children)
      .filter(([key, child]) => key.startsWith("call"))
      .filter(
        ([key, child]) =>
          child.getSnapshot().context?.parent?.id === node.actor.id,
      )
      .map(([key, child]) => child),
  );
  return (
    <div className="mt-4 space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Runs</h3>
        {/* <Button
          variant={"outline"}
          disabled={!state.can({ type: "RESET" })}
          onClick={() =>
            actor.send({
              type: "RESET",
            })
          }
        >
          Reset
        </Button> */}
      </div>

      <div className="flex flex-col space-y-2">
        {runs.length === 0 && (
          <div className="flex flex-col items-center justify-center space-y-2">
            <Icons.bird className="h-12 w-12" />
            <span className="text-muted-foreground">
              No runs available, when it happens it will show up here.
            </span>
          </div>
        )}
        {runs.map((run) => {
          return <Run key={run.id} run={run} />;
        })}
      </div>
    </div>
  );
};

const Run = ({ run }: { run: AnyActorRef }) => {
  const state = useSelector(run, (state) => state);
  console.log(state);
  return (
    <div className="flex flex-col space-y-2 rounded border bg-muted/20 p-2">
      <div className="flex flex-row items-center justify-between ">
        <div className="flex  items-center space-x-2">
          <Label>Run Id</Label>
          <Badge variant={"outline"}>{run.id}</Badge>
        </div>
        <div className="flex flex-row space-x-1">
          <Badge className={cn(state.status === "done" && "bg-green-400")}>
            {state.value}
          </Badge>
          {state.value === "error" && state.can({ type: "RETRY" }) && (
            <Button
              variant={"outline"}
              size={"sm"}
              onClick={() =>
                run.send({
                  type: "RETRY",
                })
              }
            >
              Retry
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {state.value === "error" && (
          <div className="col-span-2">
            <Label>Error</Label>
            <div className="p-2">
              <JSONView src={state.error} />
            </div>
          </div>
        )}
        <div className="border-1 rounded bg-muted/30 p-2">
          <Label>Input</Label>
          <div className="p-2">
            <JSONView src={state.context.inputs} />
          </div>
        </div>
        <div className="border-1 rounded bg-muted/30 p-2">
          <Label>Output</Label>
          <div className="p-2">
            <JSONView src={state.context.outputs} />
          </div>
        </div>
      </div>
    </div>
  );
};
