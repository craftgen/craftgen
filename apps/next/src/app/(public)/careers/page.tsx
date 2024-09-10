import Link from "next/link";
import { Clock, DollarSign } from "lucide-react";

import { Button } from "@craftgen/ui/components/button";

import { perks, positions, values } from "./data";

export const metadata = {
  title: "Careers - CraftGen",
  description: "Work with us to craft the future of AI Agents.",
};

export default function CareersPage() {
  return (
    <div className="container prose relative m-auto mb-20 min-h-screen max-w-4xl p-4 pt-32 ">
      <div
        className="bloom subtle egg-bloom-two -top-60 right-[-400px]"
        style={{ transform: "scale(2)" }}
      />
      <h1 className="mb-3 px-2 text-center text-4xl font-black leading-tight duration-300 animate-in fade-in slide-in-from-bottom-10 md:text-5xl">
        Craft the future of AI Agents.
      </h1>
      <div className="animation-delay-1 z-30 flex flex-col items-center">
        <p className="z-40 text-center text-lg text-muted-foreground">
          CraftGen is revolutionizing the way we interact with AI, creating an
          open ecosystem that empowers users to build custom AI solutions that
          streamline workflows, automate tasks, and unlock new levels of
          efficiency and creativity.
        </p>
        <Link href="#open-positions">
          <Button className="z-30 cursor-pointer border-0" variant="secondary">
            See Open Positions
          </Button>
        </Link>
        <hr className="border-1 my-24 w-full border-gray-900 opacity-10 dark:border-gray-200" />
        <h2 className="mb-0 px-2 text-center text-4xl font-black leading-tight">
          Our Values
        </h2>
        <p className="mb-4 mt-2">What drives us daily.</p>
        <div className="mt-5 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {values.map((value, index) => (
            <div
              key={value.title + index}
              className="bg-gray-550/50 flex flex-col rounded-md border border-gray-500 p-10"
            >
              <value.icon
                width="1em"
                height="1em"
                className="text-[32px]"
                weight="bold"
              />
              <h3 className="mb-1 mt-4 text-2xl font-bold leading-snug">
                {value.title}
              </h3>
              <p className="mb-0 mt-1 text-muted-foreground">{value.desc}</p>
            </div>
          ))}
        </div>
        <hr className="border-1 my-24 w-full border-gray-900 opacity-10 dark:border-gray-200" />
        <h2 className="mb-0 px-2 text-center text-4xl font-black leading-tight ">
          Perks and Benefits
        </h2>
        <p className="mb-4 mt-2">We're behind you 100%.</p>
        <div className="mt-5 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {perks.map((value, index) => (
            <div
              key={value.title + index}
              style={{
                backgroundColor: value.color + "10",
                borderColor: value.color + "30",
              }}
              className="bg-gray-550/30 flex flex-col rounded-md border p-8"
            >
              <value.icon
                width="1em"
                height="1em"
                className="text-[32px]"
                weight="bold"
                color={value.color}
              />
              <h3 className="mb-1 mt-4">{value.title}</h3>
              <p className="mb-0 mt-1 text-sm  opacity-60">{value.desc}</p>
            </div>
          ))}
        </div>
        <hr className="border-1 my-24 w-full border-gray-900 opacity-10 dark:border-gray-200" />
        <h2
          id="open-positions"
          className="mb-0 px-2 text-center text-4xl font-black leading-tight "
        >
          Open Positions
        </h2>
        {positions.length === 0 ? (
          <p className="mt-2 text-center text-muted-foreground">
            There are no positions open at this time. Please check back later!
          </p>
        ) : (
          <>
            <p className="mb-4 mt-2">
              If any open positions suit you, apply now!
            </p>
            <div className="mt-5 grid w-full grid-cols-1 gap-4">
              {positions.map((value, index) => (
                <div
                  key={value.name + index}
                  className="bg-gray-550/50 flex flex-col rounded-md border border-gray-500 p-10"
                >
                  <div className="flex flex-col sm:flex-row">
                    <h3 className="m-0 text-2xl leading-tight">{value.name}</h3>
                    <div className="mt-3 sm:mt-0.5">
                      <span className="text-sm font-semibold text-gray-300 sm:ml-4">
                        <DollarSign className="-mt-1 mr-1 inline w-4" />
                        {value.salary}
                      </span>
                      <span className="ml-4 text-sm font-semibold text-gray-300">
                        <Clock className="-mt-1 mr-1 inline w-4" />
                        {value.type}
                      </span>
                    </div>
                  </div>
                  <p className="mb-0 mt-3 text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        <hr className="border-1 my-24 w-full border-gray-900 opacity-10 dark:border-gray-200" />
        <h2 className="mb-0 px-2 text-center text-3xl font-black ">
          How to apply?
        </h2>
        <p className="mt-2">
          Send your cover letter and resume to{" "}
          <strong>careers at craftgen dot ai</strong> and we'll get back to you
          shortly!
        </p>
        <hr className="border-1 my-24 w-full border-gray-900 opacity-10 dark:border-gray-200" />
        <h2 className="mb-0 px-2 text-center text-3xl font-black ">
          How to Stand Out?
        </h2>
        <p className="mt-2 text-center">
          While there are no open positions currently, skilled individuals can
          stand out by contributing to our open-source project and engaging with
          the Craftgen community through discord.
        </p>
      </div>
    </div>
  );
}
