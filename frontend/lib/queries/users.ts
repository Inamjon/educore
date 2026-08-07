import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/lib/api/users";

/** Shared across every feature that needs a live foundation.User record —
 * Students and Teachers both flatten only a partial view of the user onto
 * their own profile serializer, so editing first/last name, gender, or DOB
 * needs this separate fetch. */
export function useUserQuery(userId: string | null) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUser(userId as string),
    enabled: !!userId,
  });
}
