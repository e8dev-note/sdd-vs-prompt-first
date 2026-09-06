"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import {
  deleteProduct,
  setBookmark,
  updateProduct,
  validateProductUpdate,
  type FieldErrors,
} from "@/lib/products";

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("invalid id");
  deleteProduct(id);
  revalidatePath("/products");
  redirect("/products");
}

export type UpdateState = {
  status: "idle" | "success" | "error";
  errors?: FieldErrors;
  message?: string;
  /** 成功ごとに増やし、クライアント側で「閉じる」トリガーに使う。 */
  version: number;
};

export async function updateProductAction(
  prev: UpdateState,
  formData: FormData,
): Promise<UpdateState> {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    return { status: "error", message: "invalid id", version: prev.version };
  }
  const validated = validateProductUpdate({
    name: formData.get("name"),
    category: formData.get("category"),
    price: formData.get("price"),
    note: formData.get("note"),
  });
  if (validated.errors) {
    return { status: "error", errors: validated.errors, version: prev.version };
  }
  const updated = updateProduct(id, validated.value);
  if (!updated) {
    return { status: "error", message: "商品が見つかりません", version: prev.version };
  }
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { status: "success", version: prev.version + 1 };
}

/** ブックマークをトグルする。呼び出し元の画面に留まる(revalidate のみ)。 */
export async function toggleBookmarkAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("invalid id");
  const on = formData.get("on") === "1";
  setBookmark(id, on);
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
}
