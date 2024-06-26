"use client";

import { RouterOutputs } from "@craftgen/api";
import { JSONView } from "@craftgen/ui/components/json-view";
import { api } from "@craftgen/ui/lib/api";

export const StripeAccountDetails = ({
  project,
}: {
  project: RouterOutputs["project"]["bySlug"];
}) => {
  const { data: stripeAccount } = api.stripe.connect.get.useQuery({
    projectId: project.id,
  });

  return (
    <div>
      <h1>Account Details</h1>
      <p>Here you can view and edit your account details</p>
      {stripeAccount && <JSONView src={stripeAccount} />}
    </div>
  );
};
