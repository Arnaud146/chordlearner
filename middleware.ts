import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { sanitizeRedirectPath } from "./src/lib/auth/redirect";

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/api/auth/signup") return false;
  if (pathname === "/api/health") return false;
  return (
    pathname.startsWith("/songs") ||
    pathname.startsWith("/profil") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/status")
  );
}

function isAuthPath(pathname: string): boolean {
  return pathname.startsWith("/login") || pathname.startsWith("/signup");
}

function isUnsafeMethod(method: string): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function getAllowedOrigins(request: NextRequest): string[] {
  const configured = process.env.ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [request.nextUrl.origin, ...(configured ?? [])];
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }
  return getAllowedOrigins(request).includes(origin);
}

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = isProtectedPath(pathname);
  const isAuthPage = isAuthPath(pathname);

  if (pathname.startsWith("/api") && isUnsafeMethod(request.method) && !isAllowedOrigin(request)) {
    return NextResponse.json({ error: "Origin non autorisee" }, { status: 403 });
  }

  if (!isProtected && !isAuthPage) {
    return NextResponse.next({ request });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Configuration serveur incomplete" }, { status: 503 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set(
      "next",
      sanitizeRedirectPath(`${pathname}${request.nextUrl.search}`),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage) {
    const nextPath = sanitizeRedirectPath(request.nextUrl.searchParams.get("next"));
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = nextPath;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
