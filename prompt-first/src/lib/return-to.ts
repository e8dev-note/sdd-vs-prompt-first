/** ログイン後の戻り先。内部パスのみ許可する(オープンリダイレクト防止)。 */
export function safeReturnTo(v: unknown): string {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/products";
}
