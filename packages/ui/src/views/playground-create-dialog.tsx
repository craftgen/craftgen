import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useDebounce } from "react-use";
import { z } from "zod";

import { RouterOutputs } from "@craftgen/api";

import { Alert, AlertDescription, AlertTitle } from "../components/alert";
import { Badge } from "../components/badge";
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
import { ScrollArea } from "../components/scroll-area";
import { Switch } from "../components/switch";
import { Textarea } from "../components/textarea";
import { toast } from "../components/use-toast";
import { api } from "../lib/api";
import { slugify } from "../lib/string";
import { cn } from "../lib/utils";

const formSchema = z.object({
  template: z.string().nullable(),
  name: z.string().min(2, {
    message: "Playground Name must be at least 2 characters.",
  }),
  slug: z.string(),
  description: z.string().default(""),
  public: z.boolean().default(true),
});

const templates = [
  {
    id: "blank",
    name: "Blank",
    description: "Blank playground with no setup.",
  },
  {
    id: "starter",
    name: "Starter",
    description: "Starter playground with basic setup.",
    required: ["openai"],
  },
  {
    id: "simple-blog",
    name: "Simple Blog",
    description: "Simple Blog crafting setup.",
    required: ["openai"],
  },
  {
    id: "blog-with-ai-images",
    name: "Blog with AI Images",
    description: "blog post with sparkle of AI images crafting setup.",
    required: ["openai", "replicate"],
  },
  {
    id: "product-description",
    name: "Product description",
    description: "Product description crafting setup.",
    required: ["openai"],
  },
  {
    id: "product-comparison",
    name: "Product comparison",
    description: "Product comparison crafting setup.",
    required: ["openai"],
  },
];

export const WorkflowCreateDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectSlug: string;
  onCreate: (data: RouterOutputs["craft"]["module"]["create"]) => void;
}> = ({ isOpen, onOpenChange, projectSlug, onCreate }) => {
  const { data: project } = api.project.bySlug.useQuery({
    projectSlug: projectSlug,
  });

  const utils = api.useUtils();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(
      formSchema.refine(
        async ({ slug }) => {
          const val = await utils.project.checkSlugAvailable.fetch({
            slug,
            projectId: project?.id!,
          });
          return val;
        },
        {
          message: "Name is not available.",
          path: ["name"],
        },
      ) as any, //TODO: fix this
      {},
      {
        mode: "async",
      },
    ),
    defaultValues: {
      template: null,
      name: "",
      slug: "",
      description: "",
      public: true,
    },
  });
  const name = form.watch("name");
  useEffect(() => {
    form.setValue("slug", slugify(name));
  }, [name]);
  const slug = form.watch("slug");
  const [nameAvailable, setNameAvailable] = useState(true);
  useDebounce(
    async () => {
      const available = await utils.project.checkSlugAvailable.fetch({
        slug,
        projectId: project?.id!,
      });
      setNameAvailable(available);
    },
    500,
    [slug],
  );

  const { mutateAsync: createWorkflow, error } =
    api.craft.module.create.useMutation({
      onSuccess: async () => {
        await utils.craft.module.list.invalidate();
      },
    });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const newPlayground = createWorkflow({
      projectId: project?.id!,
      public: data.public,
      name: data.name,
      slug: data.slug,
      description: data.description,
    });
    toast.promise(newPlayground, {
      loading: "Creating playground...",
      success: (data) => {
        onCreate(data);
        return `Playground ${data.name} created successfully!`;
      },
      error: "Something went wrong.",
    });
    if (error) {
      return;
    }

    form.reset();
    onOpenChange(false);
  };
  const template = form.watch("template");
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    form.setValue("template", templateId);
    if (template && templateId !== "blank") {
      form.setValue("name", template?.name);
      form.setValue("description", template?.description);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="min-h-1/2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <DialogHeader>
              <DialogTitle>Create Playground</DialogTitle>
              <DialogDescription>
                {template === null ? (
                  <span>
                    Choose a template to get started or create a blank
                    playground.
                  </span>
                ) : (
                  <span>Create a new playground for your project.</span>
                )}
              </DialogDescription>
            </DialogHeader>
            {template === null && (
              <div className="">
                <ScrollArea className="h-[18rem]">
                  <div className="grid grid-cols-2 gap-8 px-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex aspect-square h-full cursor-pointer flex-col rounded  bg-muted/80 p-4 shadow hover:bg-muted hover:shadow-lg"
                        onClick={() => handleTemplateChange(template.id)}
                      >
                        <h5 className="text-lg font-bold">{template.name}</h5>
                        <p className="text-sm text-secondary-foreground">
                          {template.description}
                        </p>
                        <div className="mt-auto self-end">
                          {template.required && (
                            <div className="flex flex-row space-x-2">
                              {template.required.map((req) => (
                                <Badge key={req}>{req}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            {template && (
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
                      <div className="flex items-center">
                        {name.length > 2 && (
                          <>
                            {!nameAvailable ? (
                              <>
                                <Badge variant={"destructive"} className="mx-2">
                                  <X className="mr-1 inline-block h-4 w-4" />
                                  {slug}
                                </Badge>
                                is not available.
                              </>
                            ) : (
                              <>
                                {slug !== name ? (
                                  <Alert>
                                    <AlertTitle>
                                      <AlertCircle className="mr-1 inline-block h-4 w-4 text-yellow-500" />
                                      Your craft will created as{" "}
                                      <Badge variant={"outline"}>
                                        <b>{slug}</b>
                                      </Badge>
                                    </AlertTitle>
                                    <AlertDescription>
                                      The repository name can only contain ASCII
                                      letters, digits, and the characters ., -,
                                      and _.
                                    </AlertDescription>
                                  </Alert>
                                ) : (
                                  <>
                                    <Badge
                                      variant={"secondary"}
                                      className={cn("mx-2")}
                                    >
                                      <Check className="mr-1 inline-block h-4 w-4 text-green-500" />
                                      {slug}
                                    </Badge>
                                    is available
                                  </>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
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
            )}
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
              <Button type="submit" loading={form.formState.isSubmitting}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
