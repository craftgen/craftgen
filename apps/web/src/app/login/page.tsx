import type { Metadata } from "next";

import { LoginForm } from "./login-form";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Login - craftgen.ai",
  alternates: {
    canonical: "/login",
  },
};

function LoginPage() {
  return (
    <div className="bg-muted flex h-full min-h-screen">
      <div className=" relative hidden w-0 flex-1 p-8 lg:block">
        <div className="flex h-full flex-col rounded-3xl border bg-white">
          <div className="flex-1 p-8">
            <h1 className="font-sans text-3xl  font-black tracking-tighter  md:text-5xl">
              CraftGen
            </h1>
            <h2 className="mt-4 text-2xl">
              Create an <b>AI agents</b> and put your work on autopilot.
            </h2>
          </div>

          <Separator />
          <div className="bg-muted-foreground/10  rounded-b-3xl p-8 py-4">
            <Icon name="quote" className="" />
            <p className="text-lg">
              Craftgen is the easiest AI Agent builder to use and doesn’t
              require ANY technical ability. <br /> It will allow you to
              understand the TRUE value of agents
            </p>
            <div className="py-4">
              <p className="text-left">Dariia Smyrnova</p>
              <p className="text-">Founder of AI life story</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-full min-h-screen flex-1 flex-col  items-end justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto my-auto w-full max-w-sm lg:w-96">
          <div className="bg-background border-1 rounded-3xl p-8">
            <h4 className="font-bold text-lg"> Create your account</h4>
            <span className="text-muted-foreground">to continue to Craftgen</span>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
