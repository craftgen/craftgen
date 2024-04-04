import { Icons } from "@/components/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { api } from "@/trpc/server";
import { db } from "@seocraft/supabase/db";

export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  const integrations = await db.query.integration.findMany({
    columns: {
      slug: true,
    },
  });

  return integrations.map((integration) => ({
    slug: integration.slug,
  }));
}

const IntegrationPage: React.FC = async ({
  params,
}: {
  params: {
    slug: string;
  };
}) => {
  const integration = await api.public.integration.get({
    slug: params.slug,
    lang: "en",
  });
  const integrationMeta = integration?.translations[0];
  const Icon = Icons[integration.icon] || Icons["kbd"];
  return (
    <div>
      <div className="mx-auto flex max-w-6xl items-center justify-start py-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/integrations">Integrations</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{integrationMeta?.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex flex-row items-center space-x-2">
          <Icon className="h-16 w-16" />
          <h2 className="text-2xl font-bold">{integrationMeta?.name}</h2>
        </div>

        <p className="text-muted-foreground">{integrationMeta?.description}</p>
      </div>
    </div>
  );
};

export default IntegrationPage;
