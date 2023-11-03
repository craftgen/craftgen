import Link from "next/link";
import { useParams } from "next/navigation";

export default function NotFound() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/explore">Return Home</Link>
    </div>
  );
}
