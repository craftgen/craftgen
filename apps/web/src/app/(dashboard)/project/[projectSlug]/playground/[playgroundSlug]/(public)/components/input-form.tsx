"use client";

import { useMemo } from "react";
import { ResultOfAction } from "@/lib/type";
import { createExecution, getWorkflowMeta } from "../../action";
import { useForm } from "react-hook-form";
import { ajvResolver } from "@hookform/resolvers/ajv";
import { ContextFrom } from "xstate";
import { InputNodeMachine } from "../../[version]/nodes/io/input.node";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Play } from "lucide-react";
import { renderField } from "../../[version]/input/input-window";
import { Button } from "@/components/ui/button";

export const InputForm: React.FC<{
  workflow: ResultOfAction<typeof getWorkflowMeta>;
  input: ContextFrom<typeof InputNodeMachine>;
}> = ({ workflow, input }) => {
  const form = useForm({
    defaultValues: {
      ...input?.inputs,
    },
    resolver: ajvResolver(input?.schema as any),
  });

  const fields = useMemo(() => input?.outputSockets, [input?.outputSockets]);
  const onSubmit = async (data: any) => {
    console.log(data);
    // const { data: execution } = await createExecution({
    //   workflowId: workflow.id,
    //   workflowVersionId: workflow.version.id,
    //   input: {
    //     id: input.id,
    //     values: data,
    //   },
    // });
    return;
    //   try {
    //     const nodes = workflow.version.nodes.map((n) => {
    //       return {
    //         id: n.id,
    //         type: n.type as NodeTypes,
    //         contextId: n.contextId,
    //         state: JSON.stringify(n.context.state),
    //       };
    //     });
    //     const { data: execution } = await createExecution({
    //       workflowId: workflow.id,
    //       workflowVersionId: workflow.version.id,
    //       nodes,
    //       input: {
    //         id: inputs[0].id,
    //         values: data,
    //       },
    //     });
    //     if (!execution) {
    //       throw new Error("Execution not created");
    //     }
    //     console.log(execution);
    //     router.push(
    //       `/${workflow.project.slug}/${workflow.slug}/playground?execution=${execution.id}`
    //     );
    //   } catch (e) {
    //     console.log(e);
    //   }
  };

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex space-y-4 h-full flex-col"
        >
          <div className="flex flex-col space-y-2 flex-1">
            {fields?.map((f: any) => (
              <FormField
                key={f.name}
                control={form.control}
                name={f.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{f.name}</FormLabel>
                    <FormControl>{renderField(f.type, field)}</FormControl>
                    <FormDescription>{f.description}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <div className="flex items-center justify-end w-full">
            <Button type="submit" loading={form.formState.isSubmitting}>
              <Play className="w-4 h-4 mr-2" />
              Execute
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
