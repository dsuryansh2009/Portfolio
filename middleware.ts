import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const session = await auth()
  
  const isAuth = !!session
  const isAuthPage = request.nextUrl.pathname.startsWith('/admin/login')

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return null
  }

  if (!isAuth) {
    let from = request.nextUrl.pathname
    if (request.nextUrl.search) {
      from += request.nextUrl.search
    }

    return NextResponse.redirect(
      new URL(`/api/auth/signin?callbackUrl=${encodeURIComponent(from)}`, request.url)
    )
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
