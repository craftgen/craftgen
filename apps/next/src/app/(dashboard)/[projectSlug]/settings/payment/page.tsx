import { Suspense } from "react";
import { isNil } from "lodash-es";

import { Card, CardContent, CardHeader } from "@craftgen/ui/components/card";

import { api } from "@/trpc/server";

import { StripeAccountDetails } from "./account-details";
import { CreateStripeConnect } from "./create-stripe-connect";

const PaymentPage = async ({
  params,
}: {
  params: {
    projectSlug: string;
  };
}) => {
  const project = await api.project.bySlug({
    projectSlug: params.projectSlug,
  });
  return (
    <div className="flex flex-col space-y-4">
      <Card>
        <CardHeader className="text-xl">Payment</CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Manage your payment settings for your project.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="text-xl">Earn</CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Earn money from your crafts by integrating with Stripe.
          </p>
          <Suspense fallback={<div>Loading...</div>}>
            {isNil(project.stripeAccountId) ? (
              <CreateStripeConnect />
            ) : (
              <StripeAccountDetails project={project} />
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;
