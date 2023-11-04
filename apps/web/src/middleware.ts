import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import type { Database } from "@seocraft/supabase/db/database.types";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  const { error } = await supabase.auth.getSession();

  if (error) {
    res.cookies.delete("sb-siwhcblzmpihqdvvooqz-auth-token");
    return ["error", res];
  }
  return res;
}
