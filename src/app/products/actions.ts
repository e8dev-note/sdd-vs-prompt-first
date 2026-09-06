"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type FieldErrors, validateProductInput } from "@/lib/product-input";
import { deleteProduct, nowIso, parseProductId, updateProduct } from "@/lib/products";

/** 詳細画面の削除フォームから呼ばれる。不正・不在 id でも例外にせず一覧へ戻す。 */
export async function deleteProductAction(formData: FormData): Promise<void> {
  const raw = formData.get("id");
  const id = typeof raw === "string" ? parseProductId(raw) : null;
  if (id !== null) {
    deleteProduct(id);
  }
  revalidatePath("/products");
  redirect("/products");
}

export type EditState =
  | { status: "idle" }
  | { status: "error"; errors: FieldErrors; formError?: string }
  | { status: "success"; savedAt: string };

function text(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  return typeof v === "string" ? v : null;
}

/** 編集モーダルから useActionState 経由で呼ばれる。例外・redirect は使わず、結果を状態で返す。 */
export async function updateProductAction(_prev: EditState, formData: FormData): Promise<EditState> {
  const rawId = text(formData, "id");
  const id = rawId === null ? null : parseProductId(rawId);
  if (id === null) {
    return { status: "error", errors: {}, formError: "商品が見つかりません" };
  }
  const result = validateProductInput({
    name: text(formData, "name"),
    category: text(formData, "category"),
    price: text(formData, "price"),
    note: text(formData, "note"),
  });
  if (!result.ok) {
    return { status: "error", errors: result.errors };
  }
  const updated = updateProduct(id, result.value);
  if (updated === null) {
    return { status: "error", errors: {}, formError: "商品が見つかりません" };
  }
  revalidatePath(`/products/${id}`);
  revalidatePath("/products");
  return { status: "success", savedAt: nowIso() };
}
