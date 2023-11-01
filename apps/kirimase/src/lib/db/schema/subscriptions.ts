import {
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const subscriptions = pgTable(
  "subscriptions",
  {
    userId: varchar("user_id", { length: 255 })
      .unique()
      .references(() => users.id),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
    stripeSubscriptionId: varchar("stripe_subscription_id", {
      length: 255,
    }).unique(),
    stripePriceId: varchar("stripe_price_id", { length: 255 }),
    stripeCurrentPeriodEnd: timestamp("stripe_current_period_end"),
  },
  (table) => {
    return {
      pk: primaryKey(table.userId, table.stripeCustomerId),
    };
  }
);
