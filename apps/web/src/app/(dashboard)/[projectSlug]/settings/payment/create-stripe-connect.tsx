"use client";

import { useRouter } from "next/navigation";

import { Button } from "@craftgen/ui/components/button";
import { api } from "@craftgen/ui/lib/api";

import { useUser } from "@/app/(dashboard)/hooks/use-user";

export const CreateStripeConnect = () => {
  const { mutateAsync: createStripeConnect } =
    api.stripe.connect.create.useMutation();
  const user = useUser();
  const router = useRouter();
  const handleCreateStripeAccount = async (type: "express" | "standard") => {
    const { accountLink } = await createStripeConnect({
      type,
      projectSlug: user.data?.user.user_metadata.currentProjectSlug!,
    });
    router.push(accountLink.url);
  };
  return (
    <div className="flex flex-row">
      <Button onClick={() => handleCreateStripeAccount("standard")}>
        Create Stripe Connect Account
      </Button>
      <Button onClick={() => handleCreateStripeAccount("express")} disabled>
        Create Stripe Connect Account
      </Button>
    </div>
  );
};
