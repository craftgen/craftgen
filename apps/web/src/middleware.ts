import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@seocraft/supabase/db/database.types";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    res.cookies.delete("sb-siwhcblzmpihqdvvooqz-auth-token");
    return ["error", res];
  }
  return res;
}
