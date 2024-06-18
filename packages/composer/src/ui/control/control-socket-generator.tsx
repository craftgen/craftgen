import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActor, useSelector } from "@xstate/react";
import { get, isEqual, isNil, pick, set } from "lodash-es";
import { Trash2Icon, X } from "lucide-react";
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
import { ActorRefFrom, AnyActor, enqueueActions, setup } from "xstate";
import type * as z from "zod";

import {
  formSchema,
  JSONSocket,
  SocketGeneratorControl,
  // socketSchema,
} from "@craftgen/core/controls/socket-generator";
import { inputSocketMachine } from "@craftgen/core/input-socket";
import { outputSocketMachine } from "@craftgen/core/output-socket";
// import { types } from "@craftgen/core/sockets";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@craftgen/ui/components/accordion";
import { Badge } from "@craftgen/ui/components/badge";
import { Button } from "@craftgen/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@craftgen/ui/components/form";
import { Input } from "@craftgen/ui/components/input";
import { ScrollArea } from "@craftgen/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@craftgen/ui/components/select";
import { Switch } from "@craftgen/ui/components/switch";

// import { slugify } from "@craftgen/ui/lib/string";
// import { cn } from "@craftgen/ui/lib/utils";

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
      "x-controller": "textarea",
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
      "x-controller": "select",
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
      "x-controller": "file",
    },
  },
  file_url: {
    name: "File URL",
    icon: "file",
    definition: {
      type: "string",
      "x-controller": "file",
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
        type: "existing",
        definition: normalizeSelectValues(state.context.definition),
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
const normalizeSelectValues = (definition: JSONSocket): JSONSocket => {
  const dd = { ...definition };
  const selectValues = get(definition, "allOf[0].enum", []);
  console.log("SELECT VALUES:", selectValues);
  if (selectValues) {
    return set(
      dd,
      "allOf[0].enum",
      selectValues.map((m: any) => ({ value: m })),
    );
  }
  return dd;
};

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
  const formValues = form.watch();
  useEffect(() => {
    console.log("FORM: ", formValues);
  }, [formValues]);

  const onSubmit = (data?: z.infer<typeof socketSchema>) => {
    console.log({ data });
    let definition: any = data;
    const selectValues = get(data, "allOf[0].enum", []);
    if (selectValues.length > 0) {
      definition = set(
        definition,
        "allOf[0].enum",
        selectValues.map((m: { value: any }) => m.value),
      );
    }
    send({
      type: "UPDATE_SOCKET",
      params: {
        definition,
      },
    });
    send({ type: "SUBMIT" });
    props.hideGenerator();
  };

  return (
    <div className="w-full rounded border bg-muted/20 p-1">
      {state.matches("select_type") && (
        <div className="grid grid-cols-3 gap-4 p-4">
          {sockets.map(([key, socket]) => {
            return (
              <div
                onClick={() =>
                  send({ type: "SELECT_TYPE", params: { type: key } })
                }
                className="flex flex-col items-center justify-center rounded border bg-muted p-1 shadow"
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
            {state.context.type === "select" && <FieldOptionGenerator />}
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

const FieldOptionGenerator = (props: {}) => {
  const { control } = useFormContext(); // retrieve all hook methods
  const path = "allOf[0].enum";

  const { fields, append, remove, swap, move, insert } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: "allOf[0].enum", // unique name for your Field Array
  });
  const handleAppend = () => {
    append({
      value: "",
    });
  };

  return (
    <div className="flex flex-col space-y-2">
      <div>
        <FormLabel>Options</FormLabel>
        <FormDescription>
          Add options for the user or AI agent to select from.
        </FormDescription>
      </div>
      <div className="flex flex-col space-y-2">
        {fields.map((field, index) => (
          <div className="flex w-full">
            <FormField
              control={control}
              name={`${path}.${index}.value`}
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      placeholder="Give option for the user or AI agent."
                      {...field}
                      autoComplete="false"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              onClick={() => remove(index)}
              variant="icon"
              size="sm"
              type="button"
            >
              <X />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" onClick={handleAppend}>
        Add Option
      </Button>
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
      (socket: JSONSocket) => omit(socket, "x-connection") as JSONSocket,
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
              <div className="flex items-center justify-center text-sm text-muted-foreground">
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
                  <div className="relative mb-4 flex flex-col rounded border p-2 shadow @container">
                    <div className="absolute right-2 top-2"></div>
                    <div className="grid grid-cols-1 gap-2 @md:grid-cols-2 @lg:grid-cols-3">
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
