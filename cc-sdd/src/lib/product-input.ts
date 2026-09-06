/** 保存可能な形に正規化された商品入力(code は含まない)。 */
export interface ProductInput {
  name: string; // trim 済み、空でない
  category: string; // trim 済み、空でない
  price: number; // 0 以上の安全な整数
  note: string | null; // trim 後に空なら null
}

export type ProductInputField = "name" | "category" | "price" | "note";
export type FieldErrors = Partial<Record<ProductInputField, string>>;

/** FormData 由来の生値。未送信は null。 */
export interface RawProductInput {
  name: string | null;
  category: string | null;
  price: string | null;
  note: string | null;
}

export type ValidationResult = { ok: true; value: ProductInput } | { ok: false; errors: FieldErrors };

export const MESSAGES = {
  required: "必須です",
  price: "0 以上の整数で入力してください",
} as const;

/** 不正な項目は全て同時に errors に入れる。 */
export function validateProductInput(raw: RawProductInput): ValidationResult {
  const errors: FieldErrors = {};
  const name = (raw.name ?? "").trim();
  const category = (raw.category ?? "").trim();
  const priceText = (raw.price ?? "").trim();
  const noteText = (raw.note ?? "").trim();

  if (name === "") errors.name = MESSAGES.required;
  if (category === "") errors.category = MESSAGES.required;

  let price = Number.NaN;
  if (/^\d+$/.test(priceText)) price = Number(priceText);
  if (!Number.isSafeInteger(price) || price < 0) errors.price = MESSAGES.price;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, category, price, note: noteText === "" ? null : noteText } };
}
