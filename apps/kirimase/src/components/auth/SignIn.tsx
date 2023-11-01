"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "../ui/button";

export default function SignIn() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;

  if (session) {
    return (
      <div className="space-y-3">
        <p>
          Signed in as{" "}
          <span className="font-medium">{session.user?.email}</span>
        </p>
        <Button variant={"destructive"} onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p>Not signed in </p>
      <Button onClick={() => signIn()}>Sign in</Button>
    </div>
  );
}
