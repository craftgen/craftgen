"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { mutate } from "swr";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@craftgen/ui/components/alert-dialog";
import { Button } from "@craftgen/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@craftgen/ui/components/form";
import { Input } from "@craftgen/ui/components/input";
import { Label } from "@craftgen/ui/components/label";
import { Separator } from "@craftgen/ui/components/separator";
import { api } from "@craftgen/ui/lib/api";

import { deleteProject, updateProject } from "../actions";

export const ProjectSettingsSection = ({
  projectSlug,
}: {
  projectSlug: string;
}) => {
  const { data: project } = api.project.bySlug.useQuery({
    projectSlug: projectSlug,
  });
  if (!project) return null;
  return (
    <div>
      <ProjectSettinsForm project={project} />
      <Separator />
      <ProjectDeleteSection projectSlug={projectSlug} />
    </div>
  );
};

export const ProjectDeleteSection = ({
  projectSlug,
}: {
  projectSlug: string;
}) => {
  const { data: project } = api.project.bySlug.useQuery({
    projectSlug: projectSlug,
  });
  const router = useRouter();
  if (!project) return null;
  const handleDelete = async () => {
    await deleteProject({ id: project?.id! });
    router.push("/dashboard");
  };
  return (
    <div className="flex flex-col space-y-4 py-4">
      <Label>Delete Project</Label>
      <p className="text-muted-foreground">
        Deleting a project will permanently delete all data associated with this
        project.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={"destructive"} disabled={project.personal}>
            Delete Project
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(50),
});

export const ProjectSettinsForm = ({
  project,
}: {
  project: {
    id: string;
    name: string;
    slug: string;
  };
}) => {
  const form = useForm<z.infer<typeof updateProjectSchema>>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project?.name,
    },
    values: {
      name: project?.name,
    },
  });
  const onSubmit = async (data: z.infer<typeof updateProjectSchema>) => {
    await updateProject({ id: project.id, name: data.name });
    mutate(`/api/projects/${project.slug}`);
    mutate(`/api/projects`);
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My Project" {...field} />
              </FormControl>
              <FormDescription>
                The name of your project. This will be used in the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant={form.formState.isDirty ? "default" : "outline"}
          disabled={!form.formState.isDirty}
        >
          Update
        </Button>
      </form>
    </Form>
  );
};
