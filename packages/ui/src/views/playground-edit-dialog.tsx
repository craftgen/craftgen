import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/form";
import { Input } from "../components/input";
import { Switch } from "../components/switch";
import { Textarea } from "../components/textarea";
import { api } from "../lib/api";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Playground Name must be at least 2 characters.",
  }),
  description: z.string().default(""),
  public: z.boolean().default(false),
});

export const WorkflowEditDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  workflow: any;
}> = ({ isOpen, onOpenChange, workflow }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workflow?.name,
      description: workflow?.description || "",
      public: workflow?.public,
    },
  });
  const utils = api.useUtils();
  const { mutateAsync } = api.craft.module.update.useMutation({
    onSuccess: async () => {
      await utils.craft.invalidate();
    },
  });
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await mutateAsync({
      workflowId: workflow.id,
      args: data,
    });
    form.reset();
    onOpenChange(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <DialogHeader>
              <DialogTitle>Playground: {workflow.name}</DialogTitle>
              <DialogDescription>Edit the your playground.</DialogDescription>
            </DialogHeader>
            <div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Playground Name" {...field} />
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Playground description"
                        {...field}
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
                name="public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Public</FormLabel>
                      <FormDescription>
                        Allow others to view your playground.
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
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
