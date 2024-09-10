"use client";

import Link from "next/link";
import { ChevronRightIcon, GithubIcon } from "lucide-react";
import { usePostHog } from "posthog-js/react";

import ShimmerButton from "@craftgen/ui/components/shimmer-button";

import { BentoFeatures } from "@/components/marketing/bento-features";
import { FeatureCard8 } from "@/components/marketing/features/eight";
import { FeatureCard5 } from "@/components/marketing/features/five";
import { FeatureCard4 } from "@/components/marketing/features/four";
import { FeatureCard9 } from "@/components/marketing/features/nine";
import { FeatureCard1 } from "@/components/marketing/features/one";
import { FeatureCard7 } from "@/components/marketing/features/seven";
import { FeatureCard6 } from "@/components/marketing/features/six";
import { FeatureCard10 } from "@/components/marketing/features/ten";
import { FeatureCard3 } from "@/components/marketing/features/three";
import { FeatureCard2 } from "@/components/marketing/features/two";
import { Timeline } from "@/components/marketing/timeline";
import { UserCentric } from "@/components/marketing/user-centeric";

import { Waitlist } from "../waitlist/waitlist";

// import { Downloads } from "./downloads";

export default function Home() {
  const posthog = usePostHog();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center ">
      <section className="relative isolate w-full overflow-hidden">
        <svg
          className="absolute inset-0 -z-10 h-full w-full stroke-foreground/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
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
            className="overflow-visible fill-muted-foreground/10"
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
            {/* <h1 className="font-sans text-4xl  font-black tracking-tighter  md:text-6xl">
              CraftGen
            </h1> */}
            <div className="mt-24 sm:mt-32 lg:mt-16">
              <a href="#" className="inline-flex space-x-6">
                <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-semibold leading-6 text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                  Latest updates
                </span>
                <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-muted-foreground">
                  <span>Almost shipped v0.1</span>
                  <ChevronRightIcon
                    className="h-5 w-5 text-gray-500"
                    aria-hidden="true"
                  />
                </span>
              </a>
            </div>
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Build your AI workforce.
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Build useful AI agents to complete tasks on autopilot. CraftGen is
              a simple, open source platform that’s packed with pre-built
              modules that can automate your work.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Waitlist>
                <ShimmerButton
                  borderRadius="40px"
                  className="dark:text-white"
                  onClick={() => {
                    posthog.capture("cta_clicked", { cta: "waitlist" });
                  }}
                >
                  Join the waitlist
                </ShimmerButton>
              </Waitlist>
              <Link
                href="https://cal.com/necmttn/craftgen"
                className="text-sm font-semibold leading-6 text-foreground"
                onClick={() => {
                  posthog.capture("cta_clicked", { cta: "live_demo" });
                }}
              >
                Schedule a call for demo <span aria-hidden="true">→</span>
              </Link>
            </div>
            {/* <Downloads latestVersion="v0.1.0" /> */}
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
      </section>
      <section className="p-4">
        <div className="mb-8 flex flex-col items-center justify-center p-4">
          <h4 className="text-muted-foreground/70">Why?</h4>
          <h1 className="text-4xl font-bold md:text-5xl">
            Craft Your AI Agents
          </h1>
          <p className="text-xl text-muted-foreground">
            See why forward-thinking businesses and creators are choosing
            CraftGen as their AI platform.
          </p>
        </div>
        <BentoFeatures />
      </section>
      {/* <section className="flex w-full flex-col items-center text-center">
        <div className="relative w-full overflow-hidden">
          <div
            className=" absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)] "
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
        </div>

        <div className="mt-20 hidden sm:mb-8 sm:flex sm:justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 dark:ring-gray-100/10 dark:hover:ring-gray-100/20">
            Announcing our public release.{" "}
            <a
              href="https://twitter.com/craftgenai"
              target="_blank"
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
      </section> */}
      <section className="mt-8 w-full max-w-7xl p-4">
        <div className="grid w-full grid-cols-3 gap-5 ">
          {/* <div className="col-span-2">
            <UserCentric />
          </div> */}
          {/* <FeatureCard1 /> */}
          {/* <FeatureCard2 />
          <FeatureCard3 />
          <FeatureCard4 />
          <FeatureCard5 />
          <FeatureCard6 />
          <FeatureCard7 /> */}
          {/* <FeatureCard8 /> */}
          {/* <FeatureCard9 /> */}
          <div className="col-span-3">
            <FeatureCard10 />
          </div>
        </div>
      </section>
      <section className="flex flex-col items-center justify-center space-y-10 py-10">
        <h4 className="text-muted-foreground">
          Many developers already joined
        </h4>
        <h2 className="text-6xl font-bold uppercase">Join the waitlist</h2>
        <Waitlist>
          <ShimmerButton
            borderRadius="40px"
            className="dark:text-white"
            onClick={() => {
              posthog.capture("cta_clicked", { cta: "waitlist" });
            }}
          >
            Join the waitlist
          </ShimmerButton>
        </Waitlist>
      </section>
    </main>
  );
}
