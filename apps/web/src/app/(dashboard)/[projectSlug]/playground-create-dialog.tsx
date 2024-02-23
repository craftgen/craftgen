import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { debounce } from "lodash-es";
import { AlertCircle, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { useDebounce } from "react-use";
import { mutate } from "swr";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { slugify } from "@/lib/string";
import { cn } from "@/lib/utils";

import {
  checkSlugAvailable,
  createPlayground as createWorkflow,
} from "./actions";
import { useProject } from "./hooks/use-project";

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
}> = ({ isOpen, onOpenChange }) => {
  const { data: project } = useProject();

  const debouncedCheckSlugAvailable = debounce(
    async (slug) =>
      checkSlugAvailable({
        slug,
        projectId: project?.id!,
      }),
    500,
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(
      formSchema.refine(
        async ({ slug }) => {
          const val = await checkSlugAvailable({
            slug,
            projectId: project?.id!,
          });
          console.log(val);
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
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const name = form.watch("name");
  useEffect(() => {
    form.setValue("slug", slugify(name));
  }, [name]);
  const slug = form.watch("slug");
  const [nameAvailable, setNameAvailable] = useState(true);
  useDebounce(
    async () => {
      const available = await checkSlugAvailable({
        slug,
        projectId: project?.id!,
      });
      setNameAvailable(available);
    },
    500,
    [slug],
  );

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log(data);
    const {
      data: newPlayground,
      serverError,
      validationError,
    } = await createWorkflow({
      projectId: project?.id!,
      name: data.name,
      slug: data.slug,
      description: data.description,
    });
    if (!newPlayground) {
      toast({
        title: "Error",
        description:
          serverError ||
          JSON.stringify(validationError) ||
          "Something went wrong.",
      });
      return;
    }
    const t = toast({
      title: "Creating playground...",
      description: "This may take a few seconds.",
    });
    await mutate(`/api/project/${project?.id}/playgrounds`);
    router.push(`/${params.projectSlug}/${newPlayground.slug}/v/0`);
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
                    {templates.map((template, i) => (
                      <div
                        key={template.id}
                        className="bg-muted/80 hover:bg-muted flex aspect-square h-full cursor-pointer  flex-col rounded p-4 shadow hover:shadow-lg"
                        onClick={() => handleTemplateChange(template.id)}
                      >
                        <h5 className="text-lg font-bold">{template.name}</h5>
                        <p className="text-secondary-foreground text-sm">
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
