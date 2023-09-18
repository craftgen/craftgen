"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DialogDescription, DialogTrigger } from "@radix-ui/react-dialog";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addToWaitlist } from "../action";
import { MutableRefObject, PropsWithChildren, useRef, useState } from "react";
import { Confettis } from "@/components/confetti";
import Image from "next/image";

const formSchema = z.object({
  email: z.string().email(),
  platforms: z.array(z.string()).optional(),
});

export const Waitlist: React.FC<PropsWithChildren> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const [success, setSuccess] = useState(false);
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await addToWaitlist(data);
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
      <DialogContent>
        {success ? (
          <div>
            <DialogHeader>
              <DialogTitle className="text-4xl">YESS!</DialogTitle>
              <DialogDescription>
                Be the first to know when we go live. For real-time updates and
                insights, follow us on{" "}
                <a
                  href="https://twitter.com/seocraftai"
                  target="_blank"
                  className="font-bold cursor-pointer text-primary"
                >
                  @seocraftai
                </a>{" "}
                to stay up to date.
              </DialogDescription>
            </DialogHeader>
            <Image
              src="/images/cant-thankyou-enough.gif"
              alt="Waitlist"
              width={500}
              height={500}
            />
            <Confettis />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                Secure Your Early Access Spot
              </DialogTitle>
              <DialogDescription>
                Secure your spot on our priority waitlist and gain early access
                to the most powerful content crafting tool. We are currently in
                private beta. Join the waitlist to get early access.
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
                  <Button type="submit">Reserve My Spot!</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
