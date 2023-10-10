import { useEffect, useMemo, useState } from "react";
import { useCraftStore } from "../use-store";
import { InputNode } from "../nodes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ControllerRenderProps, useForm } from "react-hook-form";
import { ajvResolver } from "@hookform/resolvers/ajv";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { useSelector } from "@xstate/react";
import { Input } from "@/components/ui/input";
import { SocketNameType } from "../sockets";
import { Play } from "lucide-react";
import { createExecution } from "../../action";
import { usePathname, useRouter } from "next/navigation";
import { workflow } from "@seocraft/supabase/db";

export const InputWindow: React.FC<{}> = ({}) => {
  const di = useCraftStore((state) => state.di);

  const inputs = useMemo(() => {
    return (di?.editor.getNodes().filter((node) => node instanceof InputNode) ||
      []) as InputNode[];
  }, [di?.editor.getNodes()]);
  const [input, setInput] = useState<InputNode | null>(null);

  useEffect(() => {
    if (inputs?.length === 1) {
      setInput(di?.editor.getNode(inputs[0].id) as InputNode);
    }
  }, [inputs]);

  return <InputHandler inputs={inputs} input={input} setInput={setInput} />;
};

export const InputHandler: React.FC<{
  inputs: InputNode[];
  input: InputNode | null;
  setInput: (input: InputNode | null) => void;
}> = ({ inputs, input, setInput }) => {
  return (
    <div className="w-full h-full p-4 space-y-4">
      {inputs?.length > 0 ? (
        <Select
          onValueChange={(v) =>
            setInput(inputs.find((i) => i.id === v) as InputNode)
          }
          defaultValue={inputs.length === 1 ? inputs[0].id : undefined}
        >
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
        <div className="flex items-center justify-center flex-col w-full h-full">
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
    (state) => state.context.description
  );
  const { projectSlug, workflowSlug } = useCraftStore((state) => ({
    projectSlug: state.projectSlug,
    workflowSlug: state.workflowSlug,
  }));
  const schema = useSelector(input.actor, (state) => state.context.schema);
  const fields = useSelector(
    input.actor,
    (state) => state.context.outputSockets
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
      const nodes = input.di.editor.getNodes().map((n) => {
        return {
          id: n.id,
          type: n.ID,
          contextId: n.contextId,
          state: JSON.stringify(n.actor.getSnapshot()),
        };
      });
      const { data: execution } = await createExecution({
        workflowId: input.nodeData.workflowId,
        workflowVersionId: input.nodeData.workflowVersionId,
        nodes,
        input: {
          id: input.id,
          values: data,
        },
      });
      if (!execution) {
        throw new Error("Execution not created");
      }

      router.push(`${pathname}?execution=${execution.id}`);
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
  );
};

export const renderField = (type: string, field: ControllerRenderProps) => {
  switch (type) {
    case "string":
      return <Input defaultValue={""} placeholder="seocraft" {...field} />;
    case "number":
      return (
        <Input
          defaultValue={0}
          type="number"
          placeholder="123"
          {...field}
          onChange={(e) => field.onChange(Number(e.target.value))}
        />
      );
    case "boolean":
      return <Input type="checkbox" {...field} />; // TODO: Check this guy out
    default:
      return null;
  }
};

export const renderFieldBaseOnSocketType = (
  type: SocketNameType,
  field: ControllerRenderProps
) => {
  switch (type) {
    case "String":
      return <Input placeholder="seocraft" {...field} />;
    case "Number":
      return (
        <Input
          type="number"
          placeholder="123"
          {...field}
          onChange={(e) => field.onChange(Number(e.target.value))}
        />
      );
    case "Boolean":
      return <Input type="checkbox" {...field} />;
    default:
      return null;
  }
};

export const renderControlBaseOnSocketType = (
  type: SocketNameType,
  field: ControllerRenderProps
) => {
  switch (type) {
    case "String":
    // return new Contro
    //   return <Input placeholder="seocraft" {...field} />;
    // case "Number":
    //   return (
    //     <Input
    //       type="number"
    //       placeholder="123"
    //       {...field}
    //       onChange={(e) => field.onChange(Number(e.target.value))}
    //     />
    //   );
    // case "Boolean":
    //   return <Input type="checkbox" {...field} />;
    default:
      return null;
  }
};
