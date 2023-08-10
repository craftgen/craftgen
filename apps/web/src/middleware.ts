import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@seocraft/supabase/db/database.types'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })
  const session = await supabase.auth.getSession()
  return res
}