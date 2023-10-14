import { headers } from "next/headers";
import Link from "next/link";

export default function NotFound() {
  const headersList = headers();
  const domain = headersList.get("host");
  return (
    <div>
      <h2>Not Found</h2>
      {JSON.stringify(headersList)}
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  );
}
