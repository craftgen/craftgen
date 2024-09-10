"use client";

import { useState, type PropsWithChildren } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { DialogDescription, DialogTrigger } from "@radix-ui/react-dialog";
import { usePostHog } from "posthog-js/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@craftgen/ui/components/button";
import { Confettis } from "@craftgen/ui/components/confetti";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@craftgen/ui/components/dialog";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@craftgen/ui/components/form";
import { Input } from "@craftgen/ui/components/input";
import { cn } from "@craftgen/ui/lib/utils";

import { addToWaitlist } from "../action";

const formSchema = z.object({
  email: z.string().email(),
  platforms: z.array(z.string()).optional(),
});

export const Waitlist: React.FC<PropsWithChildren> = ({ children }) => {
  const posthog = usePostHog();
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setEmail(data.email);
    await addToWaitlist(data);
    posthog.setPersonProperties({
      email: data.email,
    });
    setSuccess(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button>Unlock Early Access: Join Our Priority Waitlist</Button>
        )}
      </DialogTrigger>
      <DialogContent className={cn(success && "max-w-5xl")}>
        {success ? (
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <DialogHeader>
                  <DialogTitle className="text-4xl">YESS!</DialogTitle>
                  <DialogDescription className="space-y-2 py-2 leading-relaxed">
                    <p>
                      Thanks for joining the CraftGen waitlist! You're one step
                      closer to unlocking the power of AI.
                    </p>
                    <p>
                      We'll keep you updated with exclusive previews, launch
                      news, and early access opportunities.
                    </p>
                    <p>
                      In the meantime, connect with fellow AI enthusiasts and
                      stay in the loop by joining our
                      <a
                        href="/discord"
                        target="_blank"
                        className="cursor-pointer font-bold text-primary"
                      >
                        {" "}
                        Discord community.{" "}
                      </a>
                    </p>
                    .
                  </DialogDescription>
                </DialogHeader>
                <Image
                  src="/images/cant-thankyou-enough.gif"
                  alt="Waitlist"
                  width={500}
                  height={500}
                />
                <p className="py-4">
                  Ready for more? Spread the news on{" "}
                  <a
                    href="https://twitter.com/intent/tweet?text=%40craftgenai%20rocks%20check%20it%20out%20%F0%9F%91%89&url=craftgen.ai"
                    target="_blank"
                    className="cursor-pointer font-bold text-primary"
                  >
                    Twitter / X
                  </a>{" "}
                  now!
                </p>
              </div>
              <div className="hidden sm:block">
                <script
                  async
                  src="https://js.stripe.com/v3/pricing-table.js"
                ></script>
                <stripe-pricing-table
                  pricing-table-id="prctbl_1PjbJlGq5sEqGXRO2mqR4t43"
                  publishable-key="pk_live_51OeplEGq5sEqGXROv95gQtVZDgm3o4uvBstcPrzVCSh5215QtrUTUMiBE3XCiiXlCAdcxdNdG5CqVQ2vqXTfBws40026hqQaWG"
                  customer-email={email}
                ></stripe-pricing-table>
              </div>
            </div>
            <Confettis />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Join the waitlist</DialogTitle>
              <DialogDescription>
                Join our waitlist to be among the first to experience the power
                of AI.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="py-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Input placeholder="Email" {...field} />
                        <FormDescription>
                          (we won&apos;t spam you, we promise)!
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" loading={form.formState.isSubmitting}>
                    Reserve My Spot!
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
