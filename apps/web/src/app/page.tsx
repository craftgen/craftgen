import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-24">
      <div className="">
        <h1 className="text-5xl">TURBO SEO</h1>
        <p>
          Modern approach to SEO automation. <br />
        </p>
      </div>
      <Link href="/login" className="font-bold">
        Login
      </Link>
    </main>
  );
}
