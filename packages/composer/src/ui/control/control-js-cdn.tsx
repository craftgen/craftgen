import { useSelector } from "@xstate/react";
import { X } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";

import type { JsCdnController } from "@craftgen/core/controls/js-cdn";
import { Button } from "@craftgen/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@craftgen/ui/components/form";
import { Input } from "@craftgen/ui/components/input";

export const JsCdnControlComponent = (props: { data: JsCdnController }) => {
  const { definition, value: valueActor } = useSelector(
    props.data?.actor,
    (snap) => snap.context,
  );
  const libraries = useSelector(valueActor, (snap) => snap.context.value);

  const form = useForm<{
    libraries: { url: string }[];
  }>({
    defaultValues: {
      libraries: libraries.map((url) => ({ url })),
    },
    values: {
      libraries: libraries.map((url) => ({ url })),
    },
    mode: "onBlur",
  });

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control: form.control, // control props comes from useForm (optional: if you are using FormContext)
      name: "libraries", // unique name for your Field Array
    },
  );
  const onSubmit = (data?: any) => {
    const fieldsValue = form.getValues();
    props.data.actor.send({
      type: "SET_VALUE",
      params: {
        value: fieldsValue.libraries.map((d: any) => d.url),
      },
    });
  };
  const handleAppend = () => {
    append({ url: "" });
    onSubmit();
  };
  const handleRemove = (index: number) => {
    remove(index);
    onSubmit();
  };
  return (
    <div className="rounded border p-2">
      <Form {...form}>
        <form
          onChange={form.handleSubmit(onSubmit)}
          className="flex h-full flex-col"
        >
          <h4 className="mb-4">
            Libraries
            <span className="ml-4 text-sm text-muted-foreground">
              (cdn packages)
            </span>
          </h4>

          {fields.length === 0 && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              No library added yet
            </div>
          )}

          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center">
              <div
                key={`field.${index}`}
                className="relative mb-4 flex w-full flex-col rounded border px-2 py-1 shadow @container"
              >
                <div className="absolute right-2 top-2">
                  <Button
                    type={"button"}
                    variant={"ghost"}
                    onClick={() => handleRemove(index)}
                  >
                    <X />
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <FormField
                    control={form.control}
                    name={`libraries.${index}.url`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>JS module</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="craftgen"
                            {...field}
                            autoComplete="false"
                          />
                        </FormControl>
                        <FormDescription>cdn package url</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" onClick={handleAppend}>
            Add Library
          </Button>
        </form>
      </Form>
    </div>
  );
};
