import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()  { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // ── Route categories ──────────────────────────────────────────────────────
  const isPublic     = pathname === '/login' || pathname === '/register'
  const isOnboarding = pathname.startsWith('/onboarding')
  const isDashboard  = pathname.startsWith('/dashboard')
  const isRoot       = pathname === '/'

  // ── Not logged in → /login ────────────────────────────────────────────────
  if (!user && (isDashboard || isOnboarding || isRoot)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Logged in on public pages → /dashboard ────────────────────────────────
  if (user && (isPublic || isRoot)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ── Onboarding gate (only if flag is explicitly false AND it's been < 7d) ──
  // We use a soft check: only redirect to onboarding if user explicitly has
  // onboarding_complete === false (not undefined/null — those skip onboarding)
  // This prevents infinite redirect loops for existing users.
  if (user && isDashboard) {
    const meta = user.user_metadata ?? {}
    if (meta.onboarding_complete === false) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }
  }

  // ── Already onboarded → skip /onboarding ─────────────────────────────────
  if (user && isOnboarding && user.user_metadata?.onboarding_complete === true) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}