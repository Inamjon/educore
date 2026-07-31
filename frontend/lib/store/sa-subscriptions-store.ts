import { createEntityStore } from "./create-entity-store";
import { SA_SUBSCRIPTIONS, type SASubscription as BaseSASubscription } from "@/lib/super-admin-data";

export interface SASubscription extends BaseSASubscription {
  deletedAt?: string | null;
}

export const useSASubscriptionsStore = createEntityStore<SASubscription>(
  "educore-sa-subscriptions",
  SA_SUBSCRIPTIONS as SASubscription[],
  "sub"
);
