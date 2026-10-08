import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isAuth = !!req.auth
  const isAuthPage = req.nextUrl.pathname.startsWith('/admin/login')

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    return null
  }

  if (!isAuth) {
    let from = req.nextUrl.pathname
    if (req.nextUrl.search) {
      from += req.nextUrl.search
    }

    return NextResponse.redirect(
      new URL(`/api/auth/signin?callbackUrl=${encodeURIComponent(from)}`, req.url)
    )
  }
})

export const config = {
  matcher: ['/admin/:path*'],
}
