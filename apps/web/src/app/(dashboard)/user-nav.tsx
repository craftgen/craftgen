"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { isNil } from "lodash-es";

import { Button } from "@craftgen/ui/components/button";
import { UserNav } from "@craftgen/ui/views/user-nav";

import { createClient } from "@/utils/supabase/client";

export const UserNavWrapper: React.FC<{
  session?: Session;
}> = ({ session }) => {
  const router = useRouter();
  const supabase = createClient();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };
  return (
    <>
      {!isNil(session) ? (
        <UserNav Link={Link} handleLogout={handleLogout} />
      ) : (
        <Link href="/login">
          <Button>Sign up</Button>
        </Link>
      )}
    </>
  );
};
