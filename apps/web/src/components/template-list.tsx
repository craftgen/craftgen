import Image from "next/image";
import { AspectRatio } from "./ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Star, Zap } from "lucide-react";
import { ResultOf } from "@/lib/type";
import { getFeaturedWorkflows } from "@/app/(dashboard)/explore/actions";
import Link from "next/link";

type Author = {
  slug: string;
  name: string;
  avatar: string;
};

type Template = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverUrl: string;
  author: Author;
  rating: number;
  starCount: number;
  usedByCount: number;
};

const templates: Template[] = [
  {
    id: "1235",
    slug: "product-comparison",
    name: "Product Comparison",
    description:
      "A template for comparing features, prices, and reviews of different products.",
    coverUrl:
      "https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Abstract/i5.png",
    author: {
      slug: "sarah-doe",
      name: "Sarah Doe",
      avatar: "https://i.pravatar.cc/304",
    },
    rating: 4.7,
    starCount: 15,
    usedByCount: 250,
  },
  {
    id: "1236",
    slug: "faq-generation",
    name: "FAQ Generation",
    description:
      "A template to automatically create a Frequently Asked Questions section for a website.",
    coverUrl:
      "https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Abstract/i4.png",
    author: {
      slug: "sam-doe",
      name: "Sam Doe",
      avatar: "https://i.pravatar.cc/305",
    },
    rating: 4.3,
    starCount: 18,
    usedByCount: 275,
  },
  {
    id: "1237",
    slug: "news-roundup",
    name: "News Roundup",
    description:
      "A template for aggregating news articles from multiple sources into a single post.",
    coverUrl:
      "https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Abstract/i3.png",
    author: {
      slug: "susan-doe",
      name: "Susan Doe",
      avatar: "https://i.pravatar.cc/306",
    },
    rating: 4.2,
    starCount: 22,
    usedByCount: 180,
  },
  {
    id: "1238",
    slug: "event-summary",
    name: "Event Summary",
    description:
      "A template for summarizing key details and highlights of an event for quick dissemination.",
    coverUrl:
      "https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Abstract/i2.png",
    author: {
      slug: "steve-doe",
      name: "Steve Doe",
      avatar: "https://i.pravatar.cc/307",
    },
    rating: 3.9,
    starCount: 25,
    usedByCount: 220,
  },
  {
    id: "1239",
    slug: "tutorial-series",
    name: "Tutorial Series",
    description:
      "A template for creating a series of educational tutorials on a specific topic. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Laborum irure esse velit labore culpa velit incididunt in et velit anim commodo aliquip. Minim ea cupidatat tempor duis ullamco ipsum in eu ea. Non ullamco esse nostrud. Quis dolor est elit cillum ea proident reprehenderit. Dolor cupidatat id id ad et dolor sint eiusmod reprehenderit magna aliqua. Sint occaecat commodo officia.",
    coverUrl:
      "https://flow-prompt-covers.s3.us-west-1.amazonaws.com/icon/Abstract/i1.png",
    author: {
      slug: "sandy-doe",
      name: "Sandy Doe",
      avatar: "https://i.pravatar.cc/308",
    },
    rating: 4.8,
    starCount: 35,
    usedByCount: 320,
  },
];
type Workflow = ResultOf<typeof getFeaturedWorkflows>[number];

export const WorkflowList: React.FC<{
  workflows: Workflow[];
}> = ({ workflows }) => {
  return (
    <div className="grid  grid-cols-1 sm:grid-cols-2 md:grid-cols-3  gap-6">
      {workflows.map((workflow) => (
        <WorkflowItem key={workflow.id} workflow={workflow} />
      ))}
    </div>
  );
};

export const WorkflowItem: React.FC<{ workflow: Workflow }> = ({
  workflow,
}) => {
  return (
    <div className="flex flex-col group  hover:bg-muted rounded-lg cursor-pointer transition-all duration-500">
      <Link href={`/${workflow.projectSlug}/${workflow.slug}`}>
        <div className="rounded-2xl p-1  transition-all">
          <AspectRatio ratio={5 / 3}>
            <Image
              className="overflow-hidden object-cover rounded-lg aspect-"
              src={`https://source.unsplash.com/random/500x300/?${workflow.name}`}
              alt={workflow.name}
              fill
            />
          </AspectRatio>
        </div>
        <div className="p-2 flex-1 ">
          <h3 className="font-semibold">{workflow.name}</h3>
          <p className="text-muted-foreground text-sm line-clamp-3">
            {workflow.description}
          </p>
        </div>
      </Link>
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex rounded-full border-[1px] border-primary/40 items-center bg-muted/50 group-hover:bg-muted px-1 py-1">
          <Avatar className="w-5 h-5">
            <AvatarImage
              src={`https://avatar.vercel.sh/${workflow.projectSlug}.png`}
              alt={`@${workflow.project.name}`}
            />
            <AvatarFallback>{workflow.project.slug}</AvatarFallback>
          </Avatar>
          <span className="text-sm ml-2">{workflow.project.name}</span>
        </div>

        <div className="flex justify-center items-center">
          <Star className="w-4 h-4 inline-block" />
          <span className="text-sm text-muted-foreground">
            {workflow.versions[0].version}
          </span>
          <span className="text-sm text-muted-foreground">
            {" "}
            ({Math.random() * 1000 + 2000})
          </span>
          <Zap className="w-4 h-4 inline-block ml-2" />
          <span className="text-sm text-muted-foreground">
            {/* {workflow.usedByCount} */}({Math.random() * 1000 + 2000})
          </span>
        </div>
      </div>
    </div>
  );
};
