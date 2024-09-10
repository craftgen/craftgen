import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const steps = [
  {
    id: 1,
    name: "Actor Model",
    href: "#",
    status: "complete",
    description:
      "Setup the actor model for the modular AI allowing for easy integration of new models.",
    section: "bigbang",
  },
  {
    id: 2,
    name: "Graph Architecture",
    href: "#",
    status: "complete",
    description:
      "Utilize the graph architecture to create cyclic AI agent workflows.",
    section: "bigbang",
  },
  {
    id: 3,
    name: "Multi-Modal ",
    href: "#",
    status: "current",
    description:
      "Wide range of models including text generation, image generation, vision, text-to-speech, speech-to-text, and embedding models.",
    section: "bigbang",
  },
  {
    id: 4,
    name: "Observability and logging",
    href: "#",
    status: "upcoming",
    description: "Have a clear view of the AI agent's workflow and logs.",
    section: "v0.1",
  },
  {
    id: 5,
    name: "Marketplace",
    href: "#",
    status: "upcoming",
    description: "Share your workflows with the community. ",
    section: "v0.1",
  },
  {
    id: 6,
    name: "Get paid for your workflows",
    href: "#",
    status: "upcoming",
    description: "Monetize your workflows. Integration with Stripe connect.",
    section: "v0.1",
  },
  {
    id: 7,
    name: "API",
    href: "#",
    status: "upcoming",
    description: "Create an API for easy integration.",
    section: "v0.1",
  },
  {
    id: 8,
    name: "Desktop App",
    href: "#",
    status: "upcoming",
    description: "Craftgen desktop app to run workflows locally.",
    section: "v0.2",
  },
];

export const Timeline = () => {
  return (
    <div className="flex flex-col items-center space-y-4 p-8">
      <div className="mb-8 flex flex-col items-center justify-center p-4">
        <h1 className="text-5xl font-bold md:text-6xl">
          What's next for CraftGen?
        </h1>
        <p className="text-xl text-muted-foreground">
          Here is a list of the features we are working on, and the progress we
          have made so far.
        </p>
      </div>
      <nav aria-label="Progress">
        <ol role="list" className="max-w-2xl overflow-hidden">
          {steps.map((step, stepIdx) => (
            <li
              key={step.name}
              className={cn(
                stepIdx !== steps.length - 1 ? "pb-4" : "",
                "relative",
              )}
            >
              {step.status === "complete" ? (
                <>
                  {stepIdx !== steps.length - 1 ? (
                    <div
                      className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                  <a
                    href={step.href}
                    className="group relative flex items-start justify-center "
                  >
                    <span className="flex h-9 items-center">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary group-hover:bg-primary-foreground">
                        <CheckIcon
                          className="h-5 w-5 text-white"
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                    <span className="ml-4 flex w-full min-w-0 flex-col rounded border p-4">
                      <span className="text-sm font-medium">{step.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {step.description}
                      </span>
                    </span>
                  </a>
                </>
              ) : step.status === "current" ? (
                <>
                  {stepIdx !== steps.length - 1 ? (
                    <div
                      className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-muted"
                      aria-hidden="true"
                    />
                  ) : null}
                  <a
                    href={step.href}
                    className="group relative flex items-start"
                    aria-current="step"
                  >
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                      </span>
                    </span>
                    <span className="ml-4 flex w-full min-w-0 flex-col rounded border p-4">
                      <span className="text-sm font-medium text-indigo-600">
                        {step.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {step.description}
                      </span>
                    </span>
                  </a>
                </>
              ) : (
                <>
                  {stepIdx !== steps.length - 1 ? (
                    <div
                      className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300"
                      aria-hidden="true"
                    />
                  ) : null}
                  <a
                    href={step.href}
                    className="group relative flex items-start"
                  >
                    <span className="flex h-9 items-center" aria-hidden="true">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white group-hover:border-gray-400">
                        <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                      </span>
                    </span>
                    <span className="ml-4 flex w-full min-w-0 flex-col rounded border p-4">
                      <span className="text-sm font-medium text-gray-500">
                        {step.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {step.description}
                      </span>
                    </span>
                  </a>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};
