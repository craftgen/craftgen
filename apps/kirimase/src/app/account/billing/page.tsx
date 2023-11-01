import SuccessToast from "./SuccessToast";
import { ManageUserSubscriptionButton } from "./ManageSubscription";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { storeSubscriptionPlans } from "@/config/subscriptions";
import { checkAuth, getUserAuth } from "@/lib/auth/utils";
import { getUserSubscriptionPlan } from "@/lib/stripe/subscription";
import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Billing() {
  await checkAuth();
  const { session } = await getUserAuth();
  const subscriptionPlan = await getUserSubscriptionPlan();

  if (!session) return redirect("/");

  return (
    <div className="min-h-[calc(100vh-57px)] ">
      <SuccessToast />
      <Link href="/account">
        <Button variant={"link"} className="px-0">
          Back
        </Button>
      </Link>
      <h1 className="text-3xl font-semibold mb-4">Billing</h1>
      <Card className="p-6 mb-2">
        <h3 className="uppercase text-xs font-bold text-muted-foreground">
          Subscription Details
        </h3>
        <p className="text-lg font-semibold leading-none my-2">
          {subscriptionPlan.name}
        </p>
        <p className="text-sm text-muted-foreground">
          {!subscriptionPlan.isSubscribed
            ? "You are not subscribed to any plan."
            : subscriptionPlan.isCanceled
            ? "Your plan will be canceled on "
            : "Your plan renews on "}
          {subscriptionPlan?.stripeCurrentPeriodEnd
            ? subscriptionPlan.stripeCurrentPeriodEnd.toLocaleDateString()
            : null}
        </p>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {storeSubscriptionPlans.map((plan) => (
          <Card
            key={plan.id}
            className={
              plan.name === subscriptionPlan.name ? "border-primary" : ""
            }
          >
            {plan.name === subscriptionPlan.name ? (
              <div className="w-full relative">
                <div className="text-center px-3 py-1 bg-secondary-foreground text-secondary text-xs  w-fit rounded-l-lg rounded-t-none absolute right-0 font-semibold">
                  Current Plan
                </div>
              </div>
            ) : null}
            <CardHeader className="mt-2">
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-2 mb-8">
                <h3 className="font-bold">
                  <span className="text-3xl">${plan.price / 100}</span> / month
                </h3>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={`feature_${i + 1}`} className="flex gap-x-2 text-sm">
                    <CheckCircle2Icon className="text-green-400 h-5 w-5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex items-end justify-center">
              {session?.user.email ? (
                <ManageUserSubscriptionButton
                  userId={session.user.id}
                  email={session.user.email || ""}
                  stripePriceId={plan.stripePriceId}
                  stripeCustomerId={subscriptionPlan?.stripeCustomerId}
                  isSubscribed={!!subscriptionPlan.isSubscribed}
                  isCurrentPlan={subscriptionPlan?.name === plan.name}
                />
              ) : (
                <div>
                  <Link href="/account">
                    <Button className="text-center" variant="ghost">
                      Add Email to Subscribe
                    </Button>
                  </Link>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
