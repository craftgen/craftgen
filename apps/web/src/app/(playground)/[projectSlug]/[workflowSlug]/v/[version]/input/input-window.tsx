import { usePathname, useRouter } from "next/navigation";
import { ajvResolver } from "@hookform/resolvers/ajv";
import { useSelector } from "@xstate/react";
import { Play } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useForm } from "react-hook-form";

import type { InputNode } from "@seocraft/core/src/nodes";
import type { NodeProps } from "@seocraft/core/src/types";

import { createExecution } from "@/actions/create-execution";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { renderField } from "@/core/control-utils";
import { useCraftStore } from "@/core/use-store";

export const InputWindow: React.FC<{}> = observer(({}) => {
  const di = useCraftStore((state) => state.di);
  if (!di) return null;
  const inputs = di.inputs || [];
  const input = di.selectedInput;

  return (
    <InputHandler
      inputs={inputs}
      input={input}
      setInput={(id) => di.setInput(id)}
    />
  );
});

export const InputHandler: React.FC<{
  inputs: NodeProps[];
  input: NodeProps | null;
  setInput: (inputId: string) => void;
}> = ({ inputs, input, setInput }) => {
  return (
    <div className="h-full w-full space-y-4 p-4">
      {inputs?.length > 0 ? (
        <Select onValueChange={(v) => setInput(v)} defaultValue={input?.id}>
          <SelectTrigger>
            <SelectValue placeholder={"Select Input"} />
          </SelectTrigger>
          <SelectContent>
            {inputs?.map((input) => (
              <SelectItem key={input.id} value={input.id}>
                {input.actor.getSnapshot().context.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <h3>No inputs</h3>
          <p>Create an input</p>
        </div>
      )}
      <div>{input && <DynamicForm input={input} />}</div>
    </div>
  );
};

export const DynamicForm: React.FC<{ input: InputNode }> = ({ input }) => {
  const description = useSelector(
    input.actor,
    (state) => state.context.description,
  );
  const { projectSlug, workflowSlug } = useCraftStore((state) => ({
    projectSlug: state.projectSlug,
    workflowSlug: state.workflowSlug,
  }));
  const schema = input.inputSchema as any;
  const fields = useSelector(
    input.actor,
    (state) => state.context.outputSockets,
  );
  const form = useForm({
    defaultValues: {
      ...input.actor.getSnapshot().context.inputs,
    },
    resolver: ajvResolver(schema),
  });

  const router = useRouter();
  const pathname = usePathname();
  const onSubmit = async (data: any) => {
    try {
      //TODO: fix execution
      // const { data: execution } = await createExecution({
      //   workflowId: input.nodeData.workflowId,
      //   workflowVersionId: input.nodeData.workflowVersionId,
      //   input: {
      //     id: input.id,
      //     values: data,
      //   },
      //   headless: true,
      // });
      // if (!execution) {
      //   throw new Error("Execution not created");
      // }
      // router.push(`${pathname}?execution=${execution.id}`);
      // input.di.engine?.execute(input.id, undefined, execution?.id);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Form {...form}>
      <h3 className="text-muted-foreground">{description}</h3>
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
  );
};
