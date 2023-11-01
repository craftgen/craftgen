"use client";
import Link from "next/link"
import { emailSchema } from "@/lib/email/utils";
import { useRef, useState } from "react";
import { z } from "zod";

type FormInput = z.infer<typeof emailSchema>;
type Errors = { [K in keyof FormInput]: string[] };

export default function Home() {
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Errors | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const sendEmail = async () => {
    setSending(true);
    setErrors(null);
    try {
      const payload = emailSchema.parse({
        name: nameInputRef.current?.value,
        email: emailInputRef.current?.value,
      });
      console.log(payload);
      const req = await fetch("/api/email", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const { id } = await req.json();
      if (id) alert("Successfully sent!");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors(err.flatten().fieldErrors as Errors);
      }
    } finally {
      setSending(false);
    }
  };
  return (
    <main className="p-4 md:p-0">
     <div>
      <h1 className="text-2xl font-bold my-4">Send Email with Resend</h1>
      <div>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            <Link
              className="text-primary hover:text-muted-foreground underline"
              href="https://resend.com/signup"
            >
              Sign up
            </Link>{" "}
            or{" "}
            <Link
              className="text-primary hover:text-muted-foreground underline"
              href="https://resend.com/login"
            >
              Login
            </Link>{" "}
            to your Resend account
          </li>
          <li>Add and verify your domain</li>
          <li>
            Create an API Key and add to{" "}
            <span className="ml-1 font-mono font-thin text-zinc-600 bg-zinc-100 p-0.5">
              .env
            </span>
          </li>
          <li>
            Update &quot;from:&quot; in{" "}
            <span className="ml-1 font-mono font-thin text-zinc-600 bg-zinc-100 p-0.5">
              app/api/email/route.ts
            </span>
          </li>
          <li>Send email 🎉</li>
        </ol>
      </div>
     </div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-3 pt-4 border-t mt-4"
      >
        {errors && (
          <p className="bg-slate-50 p-3">{JSON.stringify(errors, null, 2)}</p>
        )}
        <div>
          <label className="text-zinc-700 text-sm">Name</label>
          <input
            type="text"
            placeholder="Tim"
            name="name"
            ref={nameInputRef}
            className={`
              w-full px-3 py-2 text-sm rounded-md border focus:outline-zinc-700 ${
                !!errors?.name ? "border-red-700" : "border-zinc-200"
              }`}
          />
        </div>
        <div>
          <label className="text-muted-foreground">Email</label>
          <input
            type="email"
            placeholder="tim@apple.com"
            name="email"
            ref={emailInputRef}
            className={`
              w-full px-3 py-2 text-sm rounded-md border focus:outline-zinc-700 ${
                !!errors?.email ? "border-red-700" : "border-zinc-200"
              }`}
          />
        </div>
        <button
          onClick={() => sendEmail()}
          className="text-sm bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-70"
          disabled={sending}
        >
          {sending ? "sending..." : "Send Email"}
        </button>
      </form>
    </main>
  );
}

