import { useParams } from "next/navigation";
import useSWR from "swr";
import { getUser } from "../actions";
import { ResultOf } from "@/lib/type";

export const useUser = (params?: {
  fallbackData?: ResultOf<typeof getUser>;
}) => {
  const res = useSWR("/api/auth/user", getUser, {
    ...(params?.fallbackData && { fallbackData: params?.fallbackData }),
  });
  return res;
};
