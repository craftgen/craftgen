import { ClassicPreset } from "rete";
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
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  UseFormStateReturn,
  useFieldArray,
  useForm,
} from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { types } from "../../sockets";

type SocketGeneratorControlOptions = {
  connectionType: "input" | "output";
  name: string;
  ignored: string[];
  tooltip: string;
  initial: Socket[];
  onChange: (data: any) => void;
};

export type Socket = z.infer<typeof socketSchema>;

export class SocketGeneratorControl extends ClassicPreset.Control {
  __type = "socket-generator";
  inputs: Socket[] = [];
  constructor(public params: SocketGeneratorControlOptions) {
    super();
    this.inputs = params.initial;
  }

  setValue(value: Socket[]) {
    this.inputs = value;
    this.params.onChange(value);
  }
}

const socketSchema = z.object({
  name: z.string().min(1).max(4),
  type: z.enum(types),
  description: z.string().optional(),
});

const formSchema = z.object({
  fields: z.array(socketSchema),
});

export function SocketGeneratorControlComponent(props: {
  data: SocketGeneratorControl;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      fields: props.data.inputs,
    },
    mode: "onBlur",
  });

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control: form.control, // control props comes from useForm (optional: if you are using FormContext)
      name: "fields", // unique name for your Field Array
    }
  );
  const onSubmit = (data?: z.infer<typeof formSchema>) => {
    const fieldsValue = form.getValues("fields");
    props.data.setValue(fieldsValue);
  };
  useEffect(() => {
    onSubmit();
  }, [fields.length]);
  return (
    <Form {...form}>
      <form
        onChange={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        SocketGeneratorControlComponent
        <Button
          type="button"
          onClick={() => append({ name: "", type: "string", description: "" })}
        >
          Add Input
        </Button>
        <ScrollArea className="max-h-fit rounded-md border p-4">
          {fields.map((field, index) => (
            <div
              key={`field.${index}`}
              className="flex flex-col border p-2 relative @container"
            >
              <div className="absolute top-2 right-2">
                <Button
                  type={"button"}
                  variant={"ghost"}
                  onClick={() => remove(index)}
                >
                  <X />
                </Button>
              </div>
              <div className="grid @lg:grid-cols-3 @md:grid-cols-2 grid-cols-1">
                <FormField
                  control={form.control}
                  name={`fields.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>name</FormLabel>
                      <FormControl>
                        <Input placeholder="shadcn" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`fields.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          console.log("ffff", value);
                          field.onChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="min-w-fit">
                            <SelectValue placeholder="Select type for field" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {types?.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>This is type for field.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`fields.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="shadcn" {...field} />
                      </FormControl>
                      <FormDescription>
                        This is your public display name.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </ScrollArea>
      </form>
    </Form>
  );
}
