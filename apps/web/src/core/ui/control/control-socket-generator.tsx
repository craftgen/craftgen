import { useSelector } from "@xstate/react";
import { Trash2Icon, X } from "lucide-react";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
import type * as z from "zod";

import type {
  formSchema,
  JSONSocket,
  SocketGeneratorControl,
} from "@seocraft/core/src/controls/socket-generator";
import { types } from "@seocraft/core/src/sockets";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { slugify } from "@/lib/string";
import { cn } from "@/lib/utils";

export function SocketGeneratorControlComponent(props: {
  data: SocketGeneratorControl;
}) {
  const sockets = useSelector<any, Record<string, JSONSocket>>(
    props.data.actor,
    props.data.selector,
  );
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      name: props.data.name,
      description: props.data.description,
      sockets: Object.values(sockets),
    },
    values: {
      name: props.data.name,
      description: props.data.description,
      sockets: Object.values(sockets),
    },
    mode: "onBlur",
  });

  // useEffect(() => {
  //   form.setValue("sockets", props.data.sockets);
  // }, [props.data.sockets]);

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control: form.control, // control props comes from useForm (optional: if you are using FormContext)
      name: "sockets", // unique name for your Field Array
    },
  );
  const onSubmit = (data?: z.infer<typeof formSchema>) => {
    const fieldsValue = form.getValues();
    console.log("@$", fieldsValue);
    const sockets = fieldsValue.sockets
      .filter((s) => s.name.length > 0)
      .reduce(
        (acc, socket) => {
          const socketKey = slugify(socket.name, "_");
          socket["x-key"] = socketKey;
          socket["x-showSocket"] = socket["x-showSocket"] ?? true;

          acc[socketKey] = socket as JSONSocket;
          return acc;
        },
        {} as Record<string, JSONSocket>,
      );
    props.data.setValue({
      ...fieldsValue,
      sockets,
    });
  };
  const handleAppend = () => {
    append({
      name: "",
      type: "string",
      description: "",
      "x-key": "",
      "x-showSocket": true,
      required: true,
    });
    onSubmit();
  };
  const handleRemove = (index: number) => {
    remove(index);
    onSubmit();
  };

  return (
    <Form {...form}>
      <form
        onChange={form.handleSubmit(onSubmit)}
        className="flex h-full flex-col"
      >
        <FormField
          control={form.control}
          name={`name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="name" {...field} />
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
          name={`description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="description" {...field} />
              </FormControl>
              <FormDescription>This is your description.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <ScrollArea className="flex max-h-fit flex-col py-4">
          <Accordion
            type="multiple"
            className={cn(
              "rounded border p-2",
              fields.length === 0 && "border-dashed",
            )}
            defaultValue={
              fields.length === 1
                ? fields.map((_, index) => `field.${index}`)
                : []
            }
          >
            {fields.length === 0 && (
              <div className="text-muted-foreground flex items-center justify-center text-sm">
                No fields added yet
              </div>
            )}
            {fields.map((field, index) => (
              <AccordionItem value={`field.${index}`} key={`field.${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex w-full items-center justify-between">
                    <Badge>{field.type}</Badge>
                    {field.name || `Untitled Field`}
                    <Button
                      type={"button"}
                      variant={"ghost"}
                      onClick={() => handleRemove(index)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="@container relative mb-4 flex flex-col rounded border p-2 shadow">
                    <div className="absolute right-2 top-2"></div>
                    <div className="@lg:grid-cols-3 @md:grid-cols-2 grid grid-cols-1 gap-2">
                      {/* <FormField
                        control={form.control}
                        name={`sockets.${index}.x-key`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="key"
                                {...field}
                                autoComplete="false"
                              />
                            </FormControl>
                            <FormDescription>
                              This is your public display name.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      /> */}
                      <FormField
                        control={form.control}
                        name={`sockets.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="craftgen"
                                {...field}
                                autoComplete="false"
                              />
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
                        name={`sockets.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
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
                            <FormDescription>
                              This is type for field.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`sockets.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Description for the field"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Description for the field.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`sockets.${index}.required`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>Required</FormLabel>
                              <FormDescription>
                                Make this field required.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                          // <FormItem className="flex items-center space-y-0">
                          //   <FormControl>
                          //     <Checkbox
                          //       className="mx-4"
                          //       checked={field.value}
                          //       onCheckedChange={field.onChange}
                          //     />
                          //   </FormControl>
                          //   <FormLabel>Required</FormLabel>
                          //   <FormMessage />
                          // </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
        <Button type="button" onClick={handleAppend}>
          Add Input
        </Button>
      </form>
    </Form>
  );
}

const FieldItem: React.FC<{
  index: number;
  handleRemove: (index: number) => void;
}> = ({ index, handleRemove }) => {
  const form = useFormContext();
  console.log(form);
  return (
    <div
      key={`field.${index}`}
      className="@container relative mb-4 flex flex-col rounded border p-2 shadow"
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
      <div className="@lg:grid-cols-3 @md:grid-cols-2 grid grid-cols-1 gap-2">
        <FormField
          control={form.control}
          name={`sockets.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="craftgen" {...field} autoComplete="false" />
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
          name={`sockets.${index}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
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
          name={`sockets.${index}.description`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Description for the field" {...field} />
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
          name={`sockets.${index}.required`}
          render={({ field }) => (
            <FormItem className="flex items-center space-y-0">
              <FormControl>
                <Checkbox
                  className="mx-4"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Required</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
