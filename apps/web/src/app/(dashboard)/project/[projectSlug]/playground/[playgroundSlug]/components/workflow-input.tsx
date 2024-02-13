"use client";

import { api } from "@/trpc/react";
import { InputForm } from "./input-form";
import { setup, assign } from "xstate";
import { useMachine, useSelector } from "@xstate/react";
import { JSONSocket } from "@seocraft/core/src/controls/socket-generator";
import { RouterOutputs } from "@seocraft/api";
import {
  getControlBySocket,
  getSocketByJsonSchemaType,
} from "@seocraft/core/src/sockets";
import { getControl } from "@/core/control";
import { useRef } from "react";

const inputMachine = setup({
  types: {
    input: {} as {
      inputs: Record<string, string>;
      inputSockets: Record<string, JSONSocket>;
      outputSockets: Record<string, JSONSocket>;
      outputs: Record<string, string>;
    },
    context: {} as {
      inputs: Record<string, any>;
      inputSockets: Record<string, JSONSocket>;
      outputSockets: Record<string, JSONSocket>;
      outputs: Record<string, any>;
    },
  },
  actions: {
    setValue: assign({
      inputs: ({ context, event }, params: { values: Record<string, any> }) => {
        const values = event.params?.values || params?.values;
        Object.keys(context.inputs).forEach((key) => {
          if (!context.inputSockets[key]) {
            delete context.inputs[key];
          }
        });
        Object.keys(values).forEach((key) => {
          if (!context.inputSockets[key]) {
            delete values[key];
          }
        });

        return {
          ...context.inputs,
          ...values,
        };
      },
    }),
  },
}).createMachine({
  id: "input",
  context: ({ input }) => {
    const defaultInputs: (typeof input)["inputs"] = {};
    for (const [key, socket] of Object.entries(input.inputSockets)) {
      if (socket.default) {
        defaultInputs[key as any] = socket.default;
      } else {
        defaultInputs[key as any] = undefined;
      }
    }

    return {
      inputs: defaultInputs,
      inputSockets: input.inputSockets,
      outputSockets: input.outputSockets,
      outputs: input.outputs,
    };
  },
  initial: "idle",
  on: {
    SET_VALUE: {
      actions: "setValue",
    },
  },
  states: {
    idle: {
      on: {
        SUBMIT: "submitting",
      },
    },
    submitting: {
      invoke: {
        src: "submit",
        onDone: "success",
        onError: "error",
      },
    },
    success: {
      type: "final",
    },
    error: {
      on: {
        SUBMIT: "submitting",
      },
    },
  },
});

export const WorkflowInput: React.FC<{
  projectSlug: string;
  workflowSlug: string;
  version: number;
}> = ({ projectSlug, workflowSlug, version }) => {
  const { data: nodes, isLoading } = api.craft.module.io.useQuery(
    {
      projectSlug: projectSlug,
      workflowSlug: workflowSlug,
      version: version!,
    },
    {
      refetchOnWindowFocus: false,
    },
  );
  console.log(nodes, isLoading);
  if (isLoading) return <div>Loading...</div>;
  if (!nodes) return <div>Not found</div>;
  return <WorkflowInputRender data={nodes} />;
};

export const WorkflowInputRender = ({
  data,
}: {
  data: RouterOutputs["craft"]["module"]["io"];
}) => {
  console.log(data);
  const [state, send, actor] = useMachine(inputMachine, {
    id: "input",
    input: {
      inputs: {},
      inputSockets: data.inputs,
      outputSockets: data.outputs,
      outputs: {},
    },
  });
  const inputs = useSelector(actor, (state) => state.context.inputs);
  console.log("STATE", { state, actor, inputs });

  const socket = getSocketByJsonSchemaType(data.inputs["system"] as any);
  const control = getControlBySocket({
    socket,
    actor,
    selector: (state) => state.context.inputs["system"],
    definition: data.inputs["system"] as any,
    onChange: (value) => {
      console.log("VALUE", value);
      send({ type: "SET_VALUE", params: { values: { system: value } } });
    },
  });

  const ref = useRef<HTMLDivElement>(null);
  const ControlElement = getControl({
    element: ref.current!,
    type: "control",
    payload: control,
  });
  console.log(actor);

  return (
    <>
      {/* <pre>{JSON.stringify({ state }, null, 2)}</pre> */}
      <section className="grid grid-cols-2 divide-x ">
        <div className="p-2">
          <h2 className="text-3xl font-bold">Input</h2>
          <div className="pt-4">
            <ControlElement data={control} />
            {/* {controller} */}
            {/* <InputForm fields={nodes?.inputs} /> */}
          </div>
        </div>
        <div className="p-2">
          <h2 className="text-3xl font-bold">Output</h2>
          <div className="space-y-2 pt-4">
            {/* <InputForm fields={nodes?.outputs} /> */}
          </div>
        </div>
      </section>
    </>
  );
};
