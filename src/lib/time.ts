/** ISO8601 UTC(ミリ秒付き)の現在時刻。created_at / updated_at はこれで揃える。 */
export function nowIso(): string {
  return new Date().toISOString();
}
