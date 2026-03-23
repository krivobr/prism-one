import { auth } from '@/lib/auth'

export const proxy = auth

export const config = {
  matcher: ['/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)'],
}
