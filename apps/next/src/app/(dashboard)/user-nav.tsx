"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export const UserNavWrapper: React.FC = () => {
  return (
    <>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton userProfileUrl="/settings"></UserButton>
      </SignedIn>
    </>
  );
};
