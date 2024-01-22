"use client";

import { GithubIcon } from "lucide-react";

import { ModeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center ">
      <div className="w-full max-w-5xl text-center">
        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:ring-gray-100/10 dark:hover:ring-gray-100/20">
            Announcing our public release.{" "}
            <a
              href="https://twitter.com/craftgenai"
              className="font-semibold text-blue-600"
            >
              <span className="absolute inset-0" aria-hidden="true" />
              Soon
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
        <h1 className="font-sans text-6xl  font-black tracking-tighter  md:text-8xl">
          CraftGen
        </h1>
        <p className="font-inter mt-8 text-2xl font-normal md:text-4xl">
          Accessible AI workflows for everyone
        </p>
        <h2 className="mt-8 text-xl md:text-2xl">
          Integrating AI into every workflow with our open-source, no-code
          platform, powered by the actor model for dynamic, graph-based
          solutions.
        </h2>

        <div className="mt-8">
          Join our community on{" "}
          <a
            href="https://discord.gg/kTJ4KCNv8U"
            className="text-blue-500 hover:text-blue-700"
          >
            Discord
          </a>
        </div>

        <div className="absolute right-2 top-2 p-2">
          <a
            href="https://github.com/craftgen/craftgen"
            className=" text-md flex items-center rounded-lg  border bg-white px-3 py-1 hover:text-blue-700 dark:bg-white/10"
          >
            Give us a ⭐️ on Github <GithubIcon className="ml-4 h-4 w-4" />
          </a>
          <div className="flex w-full justify-end p-1">
            <ModeToggle />
          </div>
        </div>
      </div>
    </main>
  );
}
