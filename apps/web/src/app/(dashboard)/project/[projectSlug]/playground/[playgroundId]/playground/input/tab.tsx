import { useEffect, useMemo, useState } from "react";
import { useCraftStore } from "../store";
import { Input as InputNode } from "../nodes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NodeProps } from "../types";
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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

export const InputWindow: React.FC<{}> = ({}) => {
  const di = useCraftStore((state) => state.di);

  const inputs = useMemo(() => {
    return (
      di?.editor.getNodes().filter((node) => node instanceof InputNode) || []
    );
  }, [di?.editor.getNodes()]);
  const [input, setInput] = useState<NodeProps | null>(null);

  return (
    <div className="w-full h-full p-4">
      {inputs?.length > 0 ? (
        <Select onValueChange={(v) => setInput(di?.editor.getNode(v)!)}>
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

export const DynamicForm: React.FC<{ input: NodeProps }> = ({ input }) => {
  const schema = useSelector(input.actor, (state) => state.context.schema);
  const fields = useSelector(input.actor, (state) => state.context.outputs);
  const form = useForm({
    resolver: ajvResolver(schema),
  });
  const onSubmit = async (data: any) => {
    console.log(data);
    input.actor.send({
      type: "SET_VALUE",
      values: data,
    });
    input.di.engine?.execute(input.id);
  };
  useEffect(() => {
    console.log({
      schema,
      fields,
    });
  }, [schema]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {JSON.stringify(fields)}
        {JSON.stringify(form.getValues())}
        <Separator />
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
        <Button>Execute</Button>
      </form>
    </Form>
  );
};

export const renderField = (type: string, field: ControllerRenderProps) => {
  switch (type) {
    case "string":
      return <Input placeholder="seocraft" {...field} />;
    case "number":
      return (
        <Input
          type="number"
          placeholder="123"
          {...field}
          onChange={(e) => field.onChange(Number(e.target.value))}
        />
      );
    case "boolean":
      return <Input type="checkbox" {...field} />;
    default:
      return null;
  }
};
