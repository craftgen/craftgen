"use client";

import { Play } from "lucide-react";
import { useForm } from "react-hook-form";
import type { ContextFrom } from "xstate";

// import { ajvResolver } from "@hookform/resolvers/ajv";
import type { InputNodeMachine } from "@seocraft/core/src/nodes/io/input.node";

import { Button } from "@craftgen/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@craftgen/ui/form";
import { renderField } from "@/core/control-utils";
import type { RouterOutputs } from "@/trpc/shared";
import { JSONSchema } from "openai/lib/jsonschema";
import { ajvResolver } from "@hookform/resolvers/ajv";

export const InputForm: React.FC<{
  workflow: RouterOutputs["craft"]["module"]["meta"];
  fields: any[];
}> = ({ workflow, fields }) => {
  const form = useForm({
    defaultValues: {
      // ...input?.fields,
    },
    // resolver: ajvResolver(input?.schema as any), // TODO: fix types
  });

  const onSubmit = async (data: any) => {
    console.log(data);
    return;
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
