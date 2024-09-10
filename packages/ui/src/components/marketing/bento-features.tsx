import { useMemo } from "react";
import {
  CalendarIcon,
  FileTextIcon,
  GlobeIcon,
  TextCursorInput,
} from "lucide-react";

import { BentoCard, BentoGrid } from "@craftgen/ui/components/bento-grid";
import { Calendar } from "@craftgen/ui/components/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@craftgen/ui/components/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@craftgen/ui/components/command";
import Globe from "@craftgen/ui/components/globe";
import { Icons } from "@craftgen/ui/components/icons";
import Marquee from "@craftgen/ui/components/marquee";
import { Separator } from "@craftgen/ui/components/separator";

const NodeCard = ({
  id,
  name,
  description,
  icon,
  // href,
  // cta,
  // className,
  // background,
}) => {
  const NodeIcon = useMemo(() => {
    if (!icon) return Icons.component;
    return Icons[icon as keyof typeof Icons];
  }, []);
  return (
    <Card className="glass light:border-2 light:border-black flex w-56 flex-1 flex-col rounded-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2 py-1">
        <div className="flex items-center space-x-2">
          <NodeIcon className="h-5 w-5" />
          <CardTitle>{name}</CardTitle>
        </div>
      </CardHeader>
      <Separator />
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

const nodes = [
  {
    id: "shopify",
    name: " Update Product",
    icon: "shopify",
    description: "Connect your Shopify store to automate your workflows.",
  },
  {
    id: "webflow",
    name: "Webflow / Add Item",
    icon: "webflow",
    description: "Connect your Webflow site to automate your workflows.",
  },
  {
    id: "replicate",
    name: "meta-llama-3-8b",
    icon: "replicate",
    description:
      "Base version of Llama 3, an 8 billion parameter language model from Meta.",
  },
  {
    id: "generateText",
    name: "generateSummary",
    icon: "text",
    description:
      "Convert long-form text into a concise summary with a single API call.",
  },
  {
    id: "stripe",
    name: "WordPress / Add Post",
    icon: "wordpress",
    description: "Publish your content to WordPress with a single API call.",
  },
];

const features = [
  {
    Icon: FileTextIcon,
    name: "Integrate with anything",
    description: "Generate Skills from any API, database, or file.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-1",
    background: (
      <Marquee
        pauseOnHover
        className="absolute top-10 [--duration:20s] [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)] "
      >
        {nodes.map((node) => (
          <NodeCard key={node.id} {...node} />
        ))}
      </Marquee>
    ),
  },
  {
    Icon: TextCursorInput,
    name: "User-Friendly",
    description: "Type a command or search to get started.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: (
      <Command className="absolute right-10 top-10 w-[70%] origin-top translate-x-0 border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:-translate-x-10">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Create New Agent</CommandItem>
            <CommandItem>Explore Marketplace</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Integrations">
            <CommandItem>Shopify</CommandItem>
            <CommandItem>Webflow</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    ),
  },
  {
    Icon: GlobeIcon,
    name: "Scale Your AI",
    description: "Run millions of AI agents on the edge.",
    href: "/",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: (
      <Globe className="top-0 h-[600px] w-[600px] transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_30%,#000_100%)] group-hover:scale-105 sm:left-40" />
    ),
  },
  {
    Icon: CalendarIcon,
    name: "Scheduled Jobs",
    description: "Set your AI to run on autopilot, anytime, day or night.",
    className: "col-span-3 lg:col-span-1",
    href: "/",
    cta: "Learn more",
    background: (
      <Calendar
        mode="single"
        selected={new Date()}
        className="absolute right-0 top-10 origin-top rounded-md border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-105"
      />
    ),
  },
  // {
  //   Icon: CalendarIcon,
  //   name: "Scheduled Jobs",
  //   description: "Set your AI to run on autopilot, anytime, day or night.",
  //   className: "col-span-3 lg:col-span-1",
  //   href: "/",
  //   cta: "Learn more",
  //   background: <IntegrationIcons />,
  // },
];

export const BentoFeatures = () => {
  return (
    <BentoGrid>
      {features.map((feature, idx) => (
        // <div key={idx}>{JSON.stringify(feature ,null, 2)}</div>
        <BentoCard key={idx} {...feature} />
      ))}
    </BentoGrid>
  );
};
