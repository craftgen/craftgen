import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { mutate } from "swr";
import { useProject } from "./hooks/use-project";
import { useToast } from "@/components/ui/use-toast";
import { useParams, useRouter } from "next/navigation";
import { createPlayground } from "./actions";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Playground Name must be at least 2 characters.",
  }),
  description: z.string().default(""),
  public: z.boolean().default(false),
});

export const PlaygroundCreateDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}> = ({ isOpen, onOpenChange }) => {
  const { data: project } = useProject();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      public: false,
    },
  });
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const handleCreatePlayground = async () => {
    const t = toast({
      title: "Creating playground...",
      description: "This may take a few seconds.",
    });

    const newPlayground = await createPlayground({ project_id: project?.id! });
    mutate(`/api/project/${project?.id}/playgrounds`);
    router.push(
      `/project/${params.projectSlug}/playground/${newPlayground.id}`
    );
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log(data);
    await mutate(`/api/project/${project?.id}/playgrounds`);
    form.reset();
    onOpenChange(false);
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <DialogHeader>
              <DialogTitle>Create Playground</DialogTitle>
              <DialogDescription>
                Create a new playground for your project.
              </DialogDescription>
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
                type="button"
                onClick={() => {
                  form.reset();
                  form.clearErrors();
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
