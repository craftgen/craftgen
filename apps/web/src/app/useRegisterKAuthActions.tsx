import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useSession, useUser } from "@clerk/nextjs";
import { isNil } from "lodash-es";

// import { useRegisterActions } from "kbar";
import { useRegisterActions } from "@craftgen/ui/kbar/use-register-actions";

export const useRegisterKAuthActions = () => {
  const { orgSlug, userId, ...rest } = useAuth();
  const router = useRouter();
  const { session } = useSession();
  const currentProjectSlug = useMemo(() => {
    return orgSlug || session?.user?.username;
  }, [session?.user]);
  useRegisterActions(
    [
      ...(!isNil(currentProjectSlug)
        ? [
            {
              id: "profile",
              name: "Profile",
              shortcut: ["@"],
              keywords: "profile",
              section: "Navigation",
              perform: () => router.push(`/${currentProjectSlug}`),
            },
          ]
        : [
            {
              id: "login",
              name: "Login",
              shortcut: ["@"],
              keywords: "login",
              section: "Navigation",
              perform: () => router.push(`/login`),
            },
          ]),
    ],
    [currentProjectSlug],
  );
};
