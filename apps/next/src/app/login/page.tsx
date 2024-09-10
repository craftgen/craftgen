import { useMemo } from "react";
import type { Metadata } from "next";
import { Card } from "@tremor/react";

import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@craftgen/ui/components/card";
import { Icon, Icons } from "@craftgen/ui/components/icons";
import Marquee from "@craftgen/ui/components/marquee";
import { Separator } from "@craftgen/ui/components/separator";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login - craftgen.ai",
  alternates: {
    canonical: "/login",
  },
};

const nodes = [
  {
    id: "ecommerceAgent",
    name: "Ecommerce Optimizer",
    icon: "shopify", // Or a more generic shopping cart icon
    description:
      "Analyze sales data, predict trends, and optimize pricing & inventory for your online store.",
  },
  {
    id: "contentAgent",
    name: "Content Generator",
    icon: "text", // Or a pen icon
    description:
      "Generate blog posts, social media captions, or product descriptions tailored to your brand.",
  },
  {
    id: "customerSupportAgent",
    name: "Customer Support Assistant",
    icon: "emoji",
    description:
      "Answer customer inquiries, troubleshoot issues, and provide personalized recommendations.",
  },
  {
    id: "dataAnalystAgent",
    name: "Data Insights",
    icon: "search",
    description:
      "Extract insights from your data, generate reports, and identify growth opportunities.",
  },
  {
    id: "marketingAgent",
    name: "Marketing Automation",
    icon: "newspaper",
    description:
      "Automate email campaigns, social media posts, and ad targeting based on customer behavior.",
  },
];

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
    <Card className="glass light:border-2 light:border-black flex w-56 flex-1 select-none flex-col rounded-lg p-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
        <div className="flex items-center space-x-2">
          <NodeIcon className="h-5 w-5" />
          <CardTitle>{name}</CardTitle>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="py-2">
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  );
};

function LoginPage() {
  return (
    <div className="flex h-full min-h-screen bg-muted">
      <div className=" relative hidden w-0 flex-1 p-8 lg:block">
        <div className="flex h-full flex-col rounded-3xl border bg-background">
          <div className="flex-1 p-8">
            <h1 className="font-sans text-3xl  font-black tracking-tighter  md:text-5xl">
              CraftGen
            </h1>
            <h2 className="mt-4 text-2xl">
              Create an <b>AI agents</b> and put your work on autopilot.
            </h2>
          </div>
          <div className="relative ">
            <Marquee
              pauseOnHover
              className="top-20 [--duration:20s] [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] "
            >
              {nodes.map((node) => (
                <NodeCard key={node.id} {...node} />
              ))}
            </Marquee>
          </div>

          <Separator />
          <div className="rounded-b-3xl  bg-muted-foreground/10 p-8 py-4">
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
          <div className="border-1 rounded-3xl bg-background p-8">
            <h4 className="text-lg font-bold"> Create your account</h4>
            <span className="text-muted-foreground">
              to continue to Craftgen
            </span>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
