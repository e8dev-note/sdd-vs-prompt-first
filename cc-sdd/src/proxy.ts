import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

/**
 * 楽観チェック: /products 配下で Cookie がなければ /login?returnTo= へ。
 * Cookie の真正性はここでは検証しない(ページ / Server Action の requireUser が DB 照合する)。
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const { pathname, search } = request.nextUrl;
    const url = new URL("/login", request.url);
    url.searchParams.set("returnTo", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/products/:path*"],
};
