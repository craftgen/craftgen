import DotPattern from "@craftgen/ui/components/dot-pattern";
import Marquee from "@craftgen/ui/components/marquee";

import { cn } from "@/lib/utils";

export const Integrations = () => {
  return (
    <div className="relative p-12">
      <div className="relative z-10 flex flex-col items-center justify-center">
        <h3 className="text-3xl font-bold">
          Seamlessly Blend Any{" "}
          <span className="text-primary">AI into Your Workflow</span>
        </h3>
        <h4>
          Mix and match AI models to craft the perfect workflow for your
          projects. Effortlessly integrate tools from OpenAI, Replicate,
          HuggingFace, and beyond.
        </h4>
        <Marquee pauseOnHover className="z-20 [--duration:30s]">
          {/* {nodes.map((node) => (
            <NodeCard key={node.id} {...node} />
          ))} */}
        </Marquee>
      </div>

      <DotPattern
        className={cn(
          "z-0",
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
        )}
      />
    </div>
  );
};
