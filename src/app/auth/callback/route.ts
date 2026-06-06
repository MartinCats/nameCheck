import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getRedirectOrigin(request: Request, requestUrl: URL) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto = forwardedProto ?? requestUrl.protocol.replace(":", "");
  const headerHost = forwardedHost ?? host;

  if (headerHost && requestUrl.hostname === "localhost" && !headerHost.startsWith("localhost")) {
    return `${proto}://${headerHost}`;
  }

  return requestUrl.origin;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const finalRedirectUrl = new URL("/dashboard", getRedirectOrigin(request, requestUrl));

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(finalRedirectUrl);
}
