import { Star, Zap } from "lucide-react";

import { RouterOutputs } from "@craftgen/api";

import { AspectRatio } from "../components/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "../components/avatar";
import { CLink } from "../components/link";
import { cn } from "../lib/utils";

export const WorkflowList: React.FC<{
  workflows: RouterOutputs["craft"]["module"]["featured"];
  Link: any;
}> = ({ workflows, Link }) => {
  return (
    <div className="grid  grid-cols-1 gap-6 sm:grid-cols-2  md:grid-cols-3">
      {workflows.map((workflow) => (
        <WorkflowItem key={workflow.id} workflow={workflow} Link={Link} />
      ))}
    </div>
  );
};

export const WorkflowItem: React.FC<{
  workflow: RouterOutputs["craft"]["module"]["featured"][number];
  Link: any;
}> = ({ workflow, Link }) => {
  const bgList = [
    "bg-gradient-to-r from-violet-400 to-purple-300",
    "bg-gradient-to-r from-rose-400 to-pink-300",
    "bg-gradient-to-r from-sky-400 to-blue-300",
    "bg-gradient-to-r from-lime-400 to-green-300",
    "bg-gradient-to-r from-amber-400 to-yellow-300",
    "bg-gradient-to-r from-rose-400 to-pink-300",
    "bg-gradient-to-r from-sky-400 to-blue-300",
  ];
  const getRandomBg = (input: string): string => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % bgList.length;
    return bgList[index] as string;
  };
  const randomBg = getRandomBg(`${workflow.projectSlug}${workflow.slug}`);
  return (
    <div className="group flex cursor-pointer  flex-col rounded-lg transition-all duration-500 hover:bg-muted">
      <CLink
        to={`/$projectSlug/$workflowSlug`}
        params={{
          projectSlug: workflow.projectSlug,
          workflowSlug: workflow.slug,
        }}
        Link={Link}
      >
        <div className="rounded-2xl p-1  transition-all">
          <AspectRatio ratio={5 / 3}>
            <div
              className={cn(
                "aspect- grid h-full items-center justify-center overflow-hidden rounded-lg  object-cover",
                randomBg,
              )}
            >
              <span className="font-inter text-2xl font-extrabold uppercase text-white/50 ">
                {workflow.name}
              </span>
            </div>
            {/* <Image
              className="aspect- overflow-hidden rounded-lg object-cover"
              src={`https://source.unsplash.com/random/500x300/?${workflow.name}`}
              alt={workflow.name}
              fill
            /> */}
          </AspectRatio>
        </div>
        <div className="flex-1 p-2 ">
          <h3 className="font-semibold">{workflow.name}</h3>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {workflow.description}
          </p>
        </div>
      </CLink>
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center rounded-full border-[1px] border-primary/40 bg-muted/50 px-1 py-1 group-hover:bg-muted">
          <Avatar className="h-5 w-5">
            <AvatarImage
              src={`https://avatar.vercel.sh/${workflow.projectSlug}.png`}
              alt={`@${workflow.project.name}`}
            />
            <AvatarFallback>{workflow.project.slug}</AvatarFallback>
          </Avatar>
          <span className="ml-2 truncate text-sm">{workflow.project.name}</span>
        </div>

        <div className="flex items-center justify-center">
          <Star className="inline-block h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            {workflow.versions[0].version}
          </span>
          {/* <span className="text-sm text-muted-foreground">
            {" "}
            ({Math.floor(Math.random() * 1000) + 2000})
          </span> */}
          <Zap className="ml-2 inline-block h-4 w-4" />
          <span className="text-sm text-muted-foreground">
            {/* {workflow.usedByCount} */}(
            {Math.floor(Math.random() * 1000) + 2000})
          </span>
        </div>
      </div>
    </div>
  );
};
