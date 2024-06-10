import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRegisterActions } from "kbar";
import { isNil } from "lodash-es";

import { useUser } from "./(dashboard)/hooks/use-user";

export const useRegisterKAuthActions = () => {
  const { data: user } = useUser();
  const router = useRouter();

  const currentProjectSlug = useMemo(() => {
    return user?.user.user_metadata.currentProjectSlug;
  }, [user]);

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
    [user],
  );
};
