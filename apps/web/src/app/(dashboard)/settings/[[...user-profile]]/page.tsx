import { UserProfile } from "@clerk/nextjs";

const UserProfilePage = () => (
  <UserProfile
    path="/settings"
    appearance={{
      elements: {
        rootBox: "w-full h-full",
        cardBox: "w-full border-none shadow-sm",
        navbar: " bg-muted/40",
      },
    }}
  />
);

export default UserProfilePage;
