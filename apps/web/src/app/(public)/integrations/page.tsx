import { useMemo } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { RouterOutputs } from "@craftgen/api";
import { Button } from "@craftgen/ui/components/button";
import { Icons } from "@craftgen/ui/components/icons";

import * as motion from "@/components/motion";
import { api } from "@/trpc/server";

type CategoryList = RouterOutputs["public"]["integration"]["categoryList"];

const IntegrationsPage = async () => {
  const data = await api.public.integration.categoryList({
    lang: "en",
  }); // This is a call to the API

  return (
    <div>
      <div className="bg-muted p-4">
        <div className="mx-auto flex max-w-6xl flex-row justify-between pb-4 pt-8">
          <div>
            <Button variant={"outline"}> Unify Your Processes</Button>
            <h1 className="text-4xl font-bold">Integrations</h1>
          </div>
          <div>
            <p className="max-w-xl text-sm text-muted-foreground">
              Connect Craftgen effortlessly with your favorite tools and
              platforms. Our integration guides ensure a smooth fusion of
              creativity, allowing you to enhance your workflow without
              disruptions.
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl ">
        <div className="relative m-auto flex gap-8 p-4">
          <motion.div
            className="sticky top-0 col-span-1 hidden flex-col space-y-2 sm:flex"
            layout
          >
            {data.map((category) => (
              <IntegrationCategoryButton
                key={category.id}
                category={category}
              />
            ))}
          </motion.div>
          <motion.div className=" max-w-4xl flex-1 space-y-10  " layout>
            <IntegrationGroup featured />
            {data.map((solution) => (
              <IntegrationGroup key={solution.id} category={solution} />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const IntegrationCategoryButton = ({
  category: solution,
}: {
  category: CategoryList[number];
}) => {
  return (
    <div className={"p-2"}>
      <a href={`/integrations#${solution.slug}`}>
        <h3 className="text-lg text-muted-foreground hover:text-foreground">
          {solution.translations[0]?.name}
        </h3>
      </a>
    </div>
  );
};

type IntegrationList = RouterOutputs["public"]["integration"]["list"];

const IntegrationGroup = async ({
  category,
  featured,
}: {
  category?: CategoryList[number];
  featured?: boolean;
}) => {
  const data = await api.public.integration.list({
    lang: "en",
    categoryId: category?.id,
    featured,
  });
  return (
    <motion.div
      initial={{
        y: 75,
        opacity: 0,
      }}
      whileInView={{
        y: 0,
        opacity: 1,
      }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="relative flex flex-col"
      id={category?.slug || "featured"}
    >
      {/* <JSONView src={data} /> */}
      <div className="p-2 ">
        <h2 className="text-2xl">
          {category?.translations[0]?.name || "Featured"}{" "}
        </h2>
      </div>
      <div className="col-span-2 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map((integration) => (
          <IntegrationItem key={integration.id} integration={integration} />
        ))}
      </div>
    </motion.div>
  );
};

const IntegrationItem = ({
  integration,
}: {
  integration: IntegrationList[number];
}) => {
  const Icon = useMemo(() => {
    return Icons[integration.icon] || Icons["kbd"];
  }, [integration]);
  return (
    <Link href={`/integration/${integration.slug}`}>
      <motion.div
        initial={{
          opacity: 0,
        }}
        whileInView={{
          opacity: 1,
        }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className={
          "group min-h-[10rem] rounded-lg bg-card/80 bg-clip-padding p-4 shadow-sm backdrop-blur-sm backdrop-filter transition-all hover:shadow"
        }
      >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center justify-start">
            <div className="mr-4 overflow-hidden rounded-full border ">
              <Icon className="h-8 w-8 p-1" />
            </div>
            <h3 className="text-lg font-bold">
              {integration.translations[0]?.name}
            </h3>
          </div>
          <span className="hidden transition-all duration-300 group-hover:block">
            <ExternalLink />
          </span>
        </div>
        <div className="py-2">
          <p className="text-muted-foreground">
            {integration.translations[0]?.description}
          </p>
        </div>
      </motion.div>
    </Link>
  );
};

export default IntegrationsPage;
