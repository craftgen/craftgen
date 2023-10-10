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
import { useFieldArray, useForm, useFormContext } from "react-hook-form";
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
import { useEffect, useMemo } from "react";
import { Trash2Icon, X } from "lucide-react";
import { types } from "../../sockets";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SocketGeneratorControl,
  formSchema,
} from "../../controls/socket-generator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export function SocketGeneratorControlComponent(props: {
  data: SocketGeneratorControl;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      name: props.data.name,
      description: props.data.description,
      sockets: props.data.sockets,
    },
    values: {
      name: props.data.name,
      description: props.data.description,
      sockets: props.data.sockets,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    form.setValue("sockets", props.data.sockets);
  }, [props.data.sockets]);

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control: form.control, // control props comes from useForm (optional: if you are using FormContext)
      name: "sockets", // unique name for your Field Array
    }
  );
  const onSubmit = (data?: z.infer<typeof formSchema>) => {
    const fieldsValue = form.getValues();
    props.data.setValue(fieldsValue);
  };
  const handleAppend = () => {
    append({
      name: "",
      type: "string",
      description: "",
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
        className="flex flex-col h-full"
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
        <ScrollArea className="max-h-fit py-4 flex flex-col">
          <Accordion type="multiple" className="border rounded p-2">
            {fields.map((field, index) => (
              <AccordionItem value={`field.${index}`} key={`field.${index}`}>
                <AccordionTrigger>
                  <div className="flex items-center justify-between w-full">
                    <Badge>{field.type}</Badge>
                    {field.name || `Untitled Field`}
                    <Button
                      type={"button"}
                      variant={"ghost"}
                      onClick={() => handleRemove(index)}
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col border p-2 relative @container rounded shadow mb-4">
                    <div className="absolute top-2 right-2"></div>
                    <div className="grid @lg:grid-cols-3 @md:grid-cols-2 grid-cols-1 gap-2">
                      <FormField
                        control={form.control}
                        name={`sockets.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="seocraft"
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
      className="flex flex-col border p-2 relative @container rounded shadow mb-4"
    >
      <div className="absolute top-2 right-2">
        <Button
          type={"button"}
          variant={"ghost"}
          onClick={() => handleRemove(index)}
        >
          <X />
        </Button>
      </div>
      <div className="grid @lg:grid-cols-3 @md:grid-cols-2 grid-cols-1 gap-2">
        <FormField
          control={form.control}
          name={`sockets.${index}.name`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="seocraft" {...field} autoComplete="false" />
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
