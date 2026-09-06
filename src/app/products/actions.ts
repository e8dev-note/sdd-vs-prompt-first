"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteProduct, parseProductId } from "@/lib/products";

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
