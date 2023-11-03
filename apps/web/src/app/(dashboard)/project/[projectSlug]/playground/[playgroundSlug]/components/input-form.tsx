"use client";

import { useMemo } from "react";
import { ajvResolver } from "@hookform/resolvers/ajv";
import { Play } from "lucide-react";
import { useForm } from "react-hook-form";
import { ContextFrom } from "xstate";

import { InputNodeMachine } from "@seocraft/core/src/nodes/io/input.node";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { renderField } from "@/core/control-utils";
import { RouterInputs } from "@/trpc/shared";

export const InputForm: React.FC<{
  workflow: RouterInputs["craft"]["module"]["meta"];
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
          className="flex h-full flex-col space-y-4"
        >
          <div className="flex flex-1 flex-col space-y-2">
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
          <div className="flex w-full items-center justify-end">
            <Button type="submit" loading={form.formState.isSubmitting}>
              <Play className="mr-2 h-4 w-4" />
              Execute
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
