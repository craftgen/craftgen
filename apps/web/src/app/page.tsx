"use client";

import { ChevronRightIcon, GithubIcon } from "lucide-react";

import { ModeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center ">
      <div className="relative isolate w-full overflow-hidden">
        <svg
          className="stroke-foreground/10 absolute inset-0 -z-10 h-full w-full [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
              width={200}
              height={200}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <svg
            x="50%"
            y={-1}
            className="fill-muted-foreground/10 overflow-visible"
          >
            <path
              d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect
            width="100%"
            height="100%"
            strokeWidth={0}
            fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
          />
        </svg>
        <div
          className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
          aria-hidden="true"
        >
          <div
            className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20"
            style={{
              clipPath:
                "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
            }}
          />
        </div>
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-40 lg:flex lg:px-8 lg:pt-40">
          <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
            <h1 className="font-sans text-4xl  font-black tracking-tighter  md:text-6xl">
              CraftGen
            </h1>
            <div className="mt-24 sm:mt-32 lg:mt-16">
              <a href="#" className="inline-flex space-x-6">
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-semibold leading-6 text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                  Latest updates
                </span>
                <span className="text-muted-foreground inline-flex items-center space-x-2 text-sm font-medium leading-6">
                  <span>Just shipped v0.1</span>
                  <ChevronRightIcon
                    className="h-5 w-5 text-gray-500"
                    aria-hidden="true"
                  />
                </span>
              </a>
            </div>
            <h1 className="text-foreground mt-10 text-4xl font-bold tracking-tight sm:text-6xl">
              Anyone can build AI workflows that perform at scale with CraftGen
            </h1>
            <p className="text-muted-foreground mt-6 text-lg leading-8">
              Build useful AI workflows without code. CraftGen is a simple, open
              source platform that’s packed with pre-built modules that can
              automate your work.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <a
                href="#"
                className="text-primary-foreground bg-primary hover:bg-primary/80 rounded-md px-3.5 py-2.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              >
                Get started
              </a>
              <a
                href="#"
                className="text-foreground text-sm font-semibold leading-6"
                onClick={() => {
                  alert(
                    "Hey there, almost there. We are working hard to get this ready.",
                  );
                }}
              >
                Live demo <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <video
                controls={false}
                autoPlay
                muted
                playsInline
                preload="auto"
                loop
                className="w-[76rem] rounded-md bg-white/5 shadow-2xl ring-1 ring-white/10"
              >
                <source src="/images/demo.mp4" type="video/mp4" />
                <img
                  src="/images/demo-cover.jpg"
                  alt="App screenshot"
                  width={2432}
                  height={1442}
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
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
