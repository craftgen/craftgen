"use client";

import { Button } from "@/components/ui/button";
import { createRelease } from "../../action";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { RocketIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const onSubmitHandler = async (data: z.infer<typeof schema>) => {
    console.log("triggered release", props);
    const { data: newVersion } = await createRelease({
      workflowId: props.playgroundId,
      changeLog: data.changeLog,
    });
    if (newVersion) {
      router.refresh();
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
        <Button variant={"secondary"} size={"sm"} className="mx-2">
          <RocketIcon className="w-4 h-4 mr-2" /> Release
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
