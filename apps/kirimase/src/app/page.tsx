
import SignIn from "@/components/auth/SignIn";
import { getUserAuth } from "@/lib/auth/utils";

export default async function Home() {
  const { session } = await getUserAuth();
  return (
    <main className="space-y-4 pt-2">
      {session ? (
        <pre className="bg-slate-100 dark:bg-slate-800 p-6">
          {JSON.stringify(session, null, 2)}
        </pre>
      ) : null}
      <SignIn />
    </main>
  );
}
