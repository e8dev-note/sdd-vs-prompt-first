import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth";

type Props = { searchParams: Promise<{ returnTo?: string | string[] }> };

export default async function LoginPage({ searchParams }: Props) {
  if (await getCurrentUser()) redirect("/products");
  const raw = (await searchParams).returnTo;
  const returnTo = Array.isArray(raw) ? raw[0] : raw;
  return (
    <section className="mx-auto mt-8 w-full max-w-sm space-y-4 rounded border border-gray-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-gray-900">ログイン</h1>
      <LoginForm returnTo={returnTo} />
    </section>
  );
}
