import { useActor, useSelector } from "@xstate/react";
import { Trash2Icon, X } from "lucide-react";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";

import {
  formSchema,
  JSONSocket,
  SocketGeneratorControl,
  socketSchema,
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
import _, { isEqual, pick, isNil } from "lodash";
import { useEffect, useMemo } from "react";
import { ActorRefFrom, AnyActor, enqueueActions, setup } from "xstate";
import { inputSocketMachine } from "@seocraft/core/src/input-socket";
import { outputSocketMachine } from "@seocraft/core/src/output-socket";

export const SocketTypes = {
  text: {
    name: "Text Input",
    icon: "text",
    definition: {
      type: "string",
    },
  },
  long_text: {
    name: "Long Text",
    icon: "paragraph",
    definition: {
      type: "string",
      "x-component": "textarea",
    },
  },
  api_key: {
    name: "API Key",
    icon: "key",
    definition: {
      type: "string",
      format: "secret",
    },
  },
  expression: {
    name: "Expression",
    icon: "code",
    definition: {
      type: "string",
      format: "expression",
    },
  },
  select: {
    name: "Select",
    icon: "select",
    definition: {
      type: "string",
      "x-component": "select",
      allOf: [
        {
          type: "string",
          enum: [],
        },
      ],
    },
  },
  boolean: {
    name: "Boolean",
    icon: "toggle",
    definition: {
      type: "boolean",
    },
  },
  number: {
    name: "Number",
    icon: "number",
    definition: {
      type: "number",
    },
  },
  array: {
    name: "Array",
    icon: "array",
    definition: {
      type: "array",
    },
  },
  object: {
    name: "Object",
    icon: "object",
    definition: {
      type: "object",
    },
  },
  file_value: {
    name: "File",
    icon: "file",
    definition: {
      type: "string",
      "x-component": "file",
    },
  },
  file_url: {
    name: "File URL",
    icon: "file",
    definition: {
      type: "string",
      "x-component": "file",
    },
  },
};

const socketCreator = setup({
  types: {} as {
    input: {
      actor: AnyActor;
      socketActor?: ActorRefFrom<
        typeof inputSocketMachine | typeof outputSocketMachine
      >;
    };
    context: {
      type: keyof typeof SocketTypes | null;
      definition: JSONSocket;
      target: AnyActor;
      socketActor?: ActorRefFrom<
        typeof inputSocketMachine | typeof outputSocketMachine
      >;
    };
  },
}).createMachine({
  context: ({ input }) => {
    if (input.socketActor) {
      const state = input.socketActor.getSnapshot();
      return {
        type: "text",
        definition: state.context.definition,
        target: input.actor,
        socketActor: input.socketActor,
      };
    }
    return {
      type: null,
      definition: {},
      target: input.actor,
    };
  },
  initial: "select_type",
  states: {
    select_type: {
      on: {
        SELECT_TYPE: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign({
              type: ({ event }) => event.params.type,
              definition: ({ event }) => ({
                ...SocketTypes[event.params.type].definition,
                "x-userDefined": true,
                "x-key": event.params.type,
              }),
            });
          }),
          target: "details",
        },
      },
      always: [
        {
          guard: ({ context }) => context.type !== null,
          target: "details",
        },
      ],
    },
    details: {
      on: {
        UPDATE_SOCKET: {
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign({
              definition: ({ context, event }) => ({
                ...context.defintion,
                ...event.params.definition,
              }),
            });
          }),
        },
        SELECT_TYPE: {
          target: "select_type",
          actions: enqueueActions(({ enqueue }) => {
            enqueue.assign({
              definition: ({ context }) => {
                return pick(context.definition, ["name, description"]);
              },
            });
          }),
        },
        SUBMIT: {
          actions: enqueueActions(({ context, check, enqueue }) => {
            if (check(({ context }) => isNil(context.socketActor))) {
              enqueue.sendTo(
                ({ context }) => context.target,
                ({ context }) => ({
                  type: "ADD_SOCKET",
                  params: {
                    side: "input",
                    definition: context.definition,
                  },
                }),
              );
            } else {
              enqueue.sendTo(
                ({ context }) => context.socketActor,
                ({ context }) => ({
                  type: "UPDATE_SOCKET",
                  params: context.definition,
                }),
              );
            }
          }),
        },
      },
    },
  },
});

export const SocketGenerator = (props: {
  actor: AnyActor;
  hideGenerator: () => void;
  socketActor?:
    | ActorRefFrom<typeof inputSocketMachine>
    | ActorRefFrom<typeof outputSocketMachine>;
}) => {
  const sockets = Object.entries(SocketTypes);
  const [state, send] = useActor(socketCreator, {
    input: { actor: props.actor, socketActor: props.socketActor },
  });
  const otherKeys = useSelector(
    props.actor,
    (state) =>
      Object.keys(state.context.inputSockets).map((key) => key.split(":")[2]),
    isEqual,
  );
  const form = useForm<z.infer<typeof socketSchema>>({
    values: state.context.definition,
    mode: "onBlur",
    resolver: zodResolver(
      socketSchema.refine(
        async (val) => {
          if (!props.socketActor) {
            return !otherKeys.includes(val["x-key"]);
          }
          return true;
          // const val = await checkSlugAvailable({
          //   slug,
          //   projectId: project?.id!,
          // });
          // return val;
        },
        {
          message:
            "Variable name is not available. there's another field with the same name.",
          path: ["x-key"],
        },
      ) as any, //TODO: fix this
      {},
      {
        mode: "async",
      },
    ),
    defaultValues: {
      // "x-key": String(+new Date()),
      ...state.context.definition,
      "x-userDefined": true,
      "x-showSocket": true,
    },
  });
  const name = form.watch("name", "");
  useEffect(() => {
    if (!form.getFieldState("x-key").isTouched && !props.socketActor) {
      console.log("SETTING KEY", slugify(name, "_"));
      form.setValue("x-key", slugify(name, "_"));
    }
  }, [name]);

  const onSubmit = (data?: z.infer<typeof socketSchema>) => {
    console.log({ data });
    send({
      type: "UPDATE_SOCKET",
      params: {
        definition: data,
      },
    });
    send({ type: "SUBMIT" });
    props.hideGenerator();
  };

  return (
    <div className="bg-muted/20 w-full rounded border p-1">
      {state.matches("select_type") && (
        <div className="grid grid-cols-3 gap-4 p-4">
          {sockets.map(([key, socket]) => {
            return (
              <div
                onClick={() =>
                  send({ type: "SELECT_TYPE", params: { type: key } })
                }
                className="bg-muted flex flex-col items-center justify-center rounded border p-1 shadow"
              >
                <span>{socket.name}</span>
              </div>
            );
          })}
        </div>
      )}
      {state.matches("details") && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex h-full flex-col"
          >
            <FormField
              control={form.control}
              name={`name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter title for input"
                      {...field}
                      autoComplete="false"
                    />
                  </FormControl>
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
                    <Input
                      placeholder="Enter description to help user or agent understand input..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`required`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Required</FormLabel>
                    <FormDescription>Make this field required.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`x-key`}
              disabled={!!props.socketActor}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variable Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter title for input"
                      {...field}
                      autoComplete="false"
                    />
                  </FormControl>
                  {!!props.socketActor && (
                    <FormDescription>
                      You can't change the variable name of an existing field.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                type="button"
                onClick={() => props.hideGenerator()}
                variant={"destructive"}
              >
                Cancel
              </Button>
              <Button disabled={!form.formState.isValid} type="submit">
                Save
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export function SocketGeneratorControlComponent(props: {
  data: SocketGeneratorControl;
}) {
  const sockets = useSelector<any, Record<string, JSONSocket>>(
    props.data.actor,
    props.data.selector,
  );
  const socketDatas = useMemo(() => {
    return Object.values(sockets).map(
      (socket: JSONSocket) => _.omit(socket, "x-connection") as JSONSocket,
    );
  }, [sockets]);

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      name: props.data.name,
      description: props.data.description,
      sockets: socketDatas,
    },
    values: {
      name: props.data.name,
      description: props.data.description,
      sockets: socketDatas,
    },
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control, // control props comes from useForm (optional: if you are using FormContext)
    name: "sockets", // unique name for your Field Array
    keyName: "x-key",
  });
  const onSubmit = (data?: z.infer<typeof formSchema>) => {
    const fieldsValue = form.getValues();

    const normalizedSockets = fieldsValue.sockets
      .filter((s) => s?.name.length > 0)
      .reduce(
        (acc, socket) => {
          console.log("SSS", socket);
          const socketKey = slugify(socket.name, "_");
          socket["x-key"] = socketKey;
          socket["x-showSocket"] = socket["x-showSocket"] ?? true;

          acc[socketKey] = socket as JSONSocket;

          if (sockets[socketKey]) {
            acc[socketKey] = {
              ...sockets[socketKey],
              ...socket,
            };
          }
          return acc;
        },
        {} as Record<string, JSONSocket>,
      );

    props.data.setValue({
      ...fieldsValue,
      sockets: normalizedSockets,
    });
  };
  const handleAppend = () => {
    append({
      name: "",
      type: "string",
      description: "",
      "x-key": String(+new Date()),
      "x-showSocket": true,
      required: true,
      "x-showController": true,
      "x-isAdvanced": false,
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
