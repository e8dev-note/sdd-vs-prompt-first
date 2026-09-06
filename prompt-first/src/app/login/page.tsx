import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "@/components/login-form";
import { safeReturnTo } from "@/lib/return-to";

export const dynamic = "force-dynamic";

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const returnTo = safeReturnTo(sp.returnTo);
  if (await getCurrentUser()) redirect(returnTo);

  return (
    <main className="mx-auto w-full max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">ログイン</h1>
      <LoginForm returnTo={returnTo} />
    </main>
  );
}
