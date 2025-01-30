import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the path starts with /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Get hostname (e.g. localhost:3000, example.com)
    const hostname = request.headers.get('host') || ''

    // Only allow localhost and local IP addresses
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1')

    if (!isLocalhost) {
      // Redirect to 404 or home page for non-localhost requests
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
} 