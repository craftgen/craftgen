import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "../components/button";
import { Form, FormField, FormItem } from "../components/form";
import { Popover, PopoverContent, PopoverTrigger } from "../components/popover";
import { Textarea } from "../components/textarea";
import { toast } from "../components/use-toast";
import { api } from "../lib/api";

const formSchema = z.object({
  feedback: z.string().min(3),
  satisfaction: z.enum(["awesome", "good", "bad", "worst"]),
});

export const FeedbackButton = () => {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const satisfaction = form.watch("satisfaction");
  const { mutateAsync: sendFeedback } = api.public.misc.feedback.useMutation();
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await sendFeedback(data);
    form.reset();
    toast("Thank you ! - Feedback sent", {
      description: "We will review your feedback and get back to you soon.",
    });
    setOpen(false);
  };
  const placeholder = useMemo(() => {
    switch (satisfaction) {
      case "awesome":
        return "What did you like the most?";
      case "good":
        return "What can we improve?";
      case "bad":
        return "What did you not like?";
      default:
        return "Your feedback...";
    }
  }, [satisfaction]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant={"outline"} size="sm">
          Feedback
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <Textarea placeholder={placeholder} {...field} />
                </FormItem>
              )}
            />
            <div className="flex w-full items-center justify-between">
              <FormField
                control={form.control}
                name="satisfaction"
                render={({ field }) => (
                  <FormItem>
                    <Button
                      variant={field.value === "awesome" ? "outline" : "ghost"}
                      className="text-xl"
                      onClick={() => field.onChange("awesome")}
                    >
                      🤩
                    </Button>
                    <Button
                      variant={field.value === "good" ? "outline" : "ghost"}
                      className="text-xl"
                      onClick={() => field.onChange("good")}
                    >
                      😊
                    </Button>
                    <Button
                      variant={field.value === "bad" ? "outline" : "ghost"}
                      className="text-xl"
                      onClick={() => field.onChange("bad")}
                    >
                      😫
                    </Button>
                  </FormItem>
                )}
              />
              <Button
                size={"sm"}
                type="submit"
                variant={"secondary"}
                loading={form.formState.isSubmitting}
              >
                Submit
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
};
