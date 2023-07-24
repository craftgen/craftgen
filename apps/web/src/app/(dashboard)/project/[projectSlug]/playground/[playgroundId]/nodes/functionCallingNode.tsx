import { useCallback, useEffect } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import useStore from "../state";
import useSWR from "swr";
import { getNodeData, setNodeData } from "./actions";
import { StateFrom, assign, createMachine } from "xstate";
import { useActor } from "@xstate/react";
import { debounce } from "lodash-es";

const functionCallingMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDMCuA7AxgFwJYHt0BhAQwBszd0oA6XCMsAYiIAkBBAOQHEBRAbQAMAXUSgADvli48hMSAAeiACwAmADQgAnogAcARhoBWAL5nN6fBDjy0WWcXKVq8ydIfylCALQA2TTo+vuYgdjgEjhRUtPSMrlIyEZ6IvoapAMyqBqpGAYj6uqo0AJxG6fo5IWEOpFHUNABOGOjR8e5JSIoqujTKvsq6yukA7LnaiKrKhsplFaZmJkA */
  id: "functionCalling",
  initial: "idle",
  context: {
    value: "",
    model: "",
  },
  types: {
    context: {} as {
      value: string;
      model: string;
    },
    events: {} as {
      type: "CHANGE";
      value: string;
    },
  },
  states: {
    idle: {
      on: {
        CHANGE: {
          actions: assign({ value: ({ event }) => event.value }),
        },
      },
    },
    running: {},
  },
});

type FunctionCallingNodeData = StateFrom<
  typeof functionCallingMachine
>["context"];

export const FunctionCallingNode: React.FC<
  NodeProps<FunctionCallingNodeData>
> = ({ id }) => {
  const { data } = useSWR(
    () => ["nodeData", id],
    ([key, id]) => getNodeData(id)
  );
  const { updateNode } = useStore();
  useEffect(() => {
    if (data) {
      updateNode(id, data?.state);
    }
  }, [data]);
  if (!data) return null;
  return (
    <FunctionCallingContent
      id={id}
      data={data.state as FunctionCallingNodeData}
    />
  );
};

export const FunctionCallingContent: React.FC<{
  id: string;
  data: FunctionCallingNodeData;
}> = ({ id, data }) => {
  const [state, send, actor] = useActor(functionCallingMachine, {
    id,
    ...(data && { state: data }),
  });
  const saveDebounced = debounce((state) => setNodeData(id, state), 2000);

  useEffect(() => {
    const listener = actor.subscribe((state) => {
      console.log("actor", state);
      saveDebounced(JSON.stringify(state));
    });
    return listener.unsubscribe;
  }, [state]);
  // const { getEdges, getNodes } = useReactFlow();

  // const outgoers = getOutgoers({ id } as Node, getNodes(), getEdges());
  // const incomingEdges = getIncomers({ id } as Node, getNodes(), getEdges());

  // console.log({ outgoers, incomingEdges });

  // const getOutgoers()
  const onChange = useCallback((evt) => {
    send({ type: "CHANGE", value: evt.target.value });
  }, []);

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <ContextMenu>
        <ContextMenuTrigger>
          <Card>
            <CardHeader>Function Call</CardHeader>
            <CardContent>
              <pre>
                <code>
                  {JSON.stringify(
                    {
                      state,
                      // outgoers,
                      // incomingEdges,
                    },
                    null,
                    2
                  )}
                </code>
              </pre>
              <Label htmlFor="text">Text</Label>
              <Input
                id="text"
                name="text"
                onChange={onChange}
                value={state.context.value}
              />
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem key={"delete"}>
            Delete
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
};
