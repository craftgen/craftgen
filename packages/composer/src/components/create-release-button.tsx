"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { RocketIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@craftgen/ui/components/badge";
import { Button } from "@craftgen/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@craftgen/ui/components/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
} from "@craftgen/ui/components/form";
import { Textarea } from "@craftgen/ui/components/textarea";
import { api } from "@craftgen/ui/lib/api";

const schema = z.object({
  changeLog: z.string(),
});

export const CreateReleaseButton = (props: {
  playgroundId: string;
  version: number;
}) => {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });
  // const router = useRouter();
  const { mutateAsync: createRelease } =
    api.craft.version.release.useMutation();
  const onSubmitHandler = async (data: z.infer<typeof schema>) => {
    console.log("triggered release", props);
    const newVersion = await createRelease({
      workflowId: props.playgroundId,
      changeLog: data.changeLog,
    });
    if (newVersion) {
      // router.push(
      //   `/${newVersion.workflow.projectSlug}/${
      //     newVersion.workflow.slug
      //   }/v/${String(newVersion.version)}`,
      // );
    }
    form.reset();
    setOpen(false);
  };
  const [open, setOpen] = useState(false);
  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={"sm"} className="mx-2" variant={"outline"}>
          <RocketIcon className="mr-2 h-4 w-4" /> Release
        </Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmitHandler)}
            className="space-y-8"
          >
            <DialogHeader>
              <DialogTitle>
                Release version{" "}
                <Badge variant={"outline"} className="text-xl">
                  {props.version}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Add a change log to describe what&apos;s new in this release.
              </DialogDescription>
            </DialogHeader>
            <FormField
              name="changeLog"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Change Log</FormLabel>
                    <Textarea {...field} placeholder="What's new?" />
                  </FormItem>
                );
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Release
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
