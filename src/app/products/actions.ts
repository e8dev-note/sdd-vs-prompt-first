"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteProduct } from "@/lib/products";

export async function deleteProductAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) throw new Error("invalid id");
  deleteProduct(id);
  revalidatePath("/products");
  redirect("/products");
}
