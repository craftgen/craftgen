"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export const UserNavWrapper: React.FC = () => {
  const { user } = useUser();
  return (
    <>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton userProfileUrl={`/${user?.username}`} />
      </SignedIn>
    </>
  );
};
