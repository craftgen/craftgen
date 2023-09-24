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
import { createPlayground, checkSlugAvailable } from "./actions";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { slugify } from "@/lib/string";
import { cn } from "@/lib/utils";
import { debounce, lowerCase } from "lodash-es";
import { useDebounce } from "react-use";
import { AlertCircle, Check, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  template: z.string().nullable(),
  name: z.string().min(2, {
    message: "Playground Name must be at least 2 characters.",
  }),
  slug: z.string(),
  description: z.string().default(""),
  public: z.boolean().default(false),
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

export const PlaygroundCreateDialog: React.FC<{
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
    500
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
        }
      ),
      {},
      {
        mode: "async",
      }
    ),
    defaultValues: {
      template: null,
      name: "",
      slug: "",
      description: "",
      public: false,
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
    [slug]
  );

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log(data);
    const newPlayground = await createPlayground({
      project_id: project?.id!,
      name: data.name,
      slug: data.slug,
      description: data.description,
    });
    const t = toast({
      title: "Creating playground...",
      description: "This may take a few seconds.",
    });
    await mutate(`/api/project/${project?.id}/playgrounds`);
    router.push(`/${params.projectSlug}/${newPlayground.slug}`);
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
      <DialogContent className="h-1/2">
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
                        className="aspect-square bg-muted/80 hover:bg-muted rounded shadow hover:shadow-lg  flex flex-col p-4 cursor-pointer h-full"
                        onClick={() => handleTemplateChange(template.id)}
                      >
                        <h5 className="font-bold text-lg">{template.name}</h5>
                        <p className="text-secondary-foreground text-sm">
                          {template.description}
                        </p>
                        <div className="self-end mt-auto">
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
                      <div className="items-center flex">
                        {name.length > 2 && (
                          <>
                            {!nameAvailable ? (
                              <>
                                <Badge variant={"destructive"} className="mx-2">
                                  <X className="w-4 h-4 inline-block mr-1" />
                                  {slug}
                                </Badge>
                                is not available.
                              </>
                            ) : (
                              <>
                                {slug !== name ? (
                                  <Alert>
                                    <AlertTitle>
                                      <AlertCircle className="w-4 h-4 inline-block text-yellow-500 mr-1" />
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
                                      <Check className="w-4 h-4 inline-block text-green-500 mr-1" />
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
