import { useCallback, useEffect, useMemo } from "react";
import {
  Handle,
  NodeProps,
  Node,
  Position,
  getIncomers,
  useUpdateNodeInternals,
  useReactFlow,
} from "reactflow";
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
import { debounce, isString } from "lodash-es";
import * as Sqrl from "squirrelly";
import { Textarea } from "@/components/ui/textarea";

// const functionCallingMachine =

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

const createFunctionCallingMachine = (
  id: string,
  data: FunctionCallingNodeData
) => {
  return createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QDMCuA7AxgFwJYHt0BhAQwBszd0oA6XCMsAYiIAkBBAOQHEBRAbQAMAXUSgADvli48hMSAAeiACwAmADQgAnogAcARhoBWAL5nN6fBDjy0WWcXKVq8ydIfylCALQA2TTo+vuYgdjgEjhRUtPSMrlIyEZ6IvoapAMyqBqpGAYj6uqo0AJxG6fo5IWEOpFHUNABOGOjR8e5JSIoqujTKvsq6yukA7LnaiKrKhsplFaZmJkA */
    id: "functionCalling",
    initial: "idle",
    context: {
      value: "",
      model: "",
      variables: [],
    },
    types: {
      context: {} as {
        value: string;
        model: string;
        variables: string[];
      },
      events: {} as {
        type: "CHANGE";
        value: string;
        variables: string[];
      },
    },
    states: {
      idle: {
        on: {
          CHANGE: {
            actions: assign({
              value: ({ event }) => event.value,
              variables: ({ event }) => event.variables,
            }),
          },
        },
      },
      running: {},
    },
  });
};

export const FunctionCallingContent: React.FC<{
  id: string;
  data: FunctionCallingNodeData;
}> = ({ id, data }) => {
  const machine = useMemo(() => createFunctionCallingMachine(id, data), [id]);

  const [state, send, actor] = useActor(machine, {
    id,
    ...(data && { state: data }),
  });
  const saveDebounced = debounce((state) => setNodeData(id, state), 5000);

  useEffect(() => {
    const listener = actor.subscribe((state) => {
      saveDebounced(JSON.stringify(state));
    });
    return listener.unsubscribe;
  }, [state]);
  const { getEdges, getNodes } = useReactFlow();

  // const outgoers = getOutgoers({ id } as Node, getNodes(), getEdges());
  const incomingEdges = getIncomers({ id } as Node, getNodes(), getEdges());


  // console.log({ outgoers, incomingEdges });

  // const getOutgoers()
  // const template = useMemo(() => {
  //   try {
  //     const rawTemplate = Sqrl.parse(state.context.value, {
  //       ...Sqrl.defaultConfig,
  //       useWith: true,
  //     });
  //     return rawTemplate;
  //   } catch {
  //     return [];
  //   }
  // }, [state.context.value]);

  const onChange = useCallback((evt) => {
    let rawTemplate: any[] = [];
    try {
      rawTemplate = Sqrl.parse(evt.target.value, {
        ...Sqrl.defaultConfig,
        useWith: true,
      })
        .filter((item) => !isString(item))
        .map((item) => {
          return item.c;
        });
    } catch {
      rawTemplate = state.context.variables;
    }
    send({ type: "CHANGE", value: evt.target.value, variables: rawTemplate });
  }, []);

  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => {
    updateNodeInternals(id);
  }, [state.context.variables]);
  const computedTemplate = useMemo(() => {
    try {
      return Sqrl.render(state.context.value, { name: "Alice" });
    } catch (err) {
      return err.message;
    }
  }, [state.context.value, getIncomers]);

  return (
    <>
      <Handle type="source" position={Position.Right}>
        Output
      </Handle>
      {state.context.variables?.map((variable, index) => (
        <Handle
          key={variable}
          id={variable}
          type="target"
          position={Position.Left}
          style={{ marginTop: index * 40 }}
          className="p-2"
        >
          {"{{"}
          {variable}
          {"}}"}
        </Handle>
      ))}
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
                      incomingEdges
                      // template,
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
              <div className={"w-full h-1 bg-foreground my-2"} />
              <div>
                <Textarea value={computedTemplate} disabled />
              </div>
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
