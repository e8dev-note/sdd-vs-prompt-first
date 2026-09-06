"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";
import { updateProductAction, type UpdateState } from "@/app/products/actions";

const initialState: UpdateState = { status: "idle", version: 0 };

export function EditProductModal({ product }: { product: Product }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateProductAction, initialState);
  const lastVersion = useRef(state.version);
  // 送信失敗時に入力値が消えないよう、制御コンポーネントで保持する。
  const toForm = (p: Product) => ({
    name: p.name,
    category: p.category,
    price: String(p.price),
    note: p.note ?? "",
  });
  const [values, setValues] = useState(() => toForm(product));
  const setField = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  // 開閉を <dialog> に同期する。
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // 保存成功(version が進んだ)ならモーダルを閉じて表示を更新する。
  useEffect(() => {
    if (state.status === "success" && state.version !== lastVersion.current) {
      lastVersion.current = state.version;
      setOpen(false);
      router.refresh();
    }
  }, [state, router]);

  const cancel = () => {
    setValues(toForm(product));
    setOpen(false);
  };

  const errors = state.status === "error" ? state.errors ?? {} : {};
  const field = (
    name: "name" | "category" | "price" | "note",
    label: string,
    input: React.ReactNode,
  ) => (
    <div className="mb-3">
      <label htmlFor={`edit-${name}`} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {input}
      {errors[name] && (
        <p id={`edit-${name}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {errors[name]}
        </p>
      )}
    </div>
  );
  const inputClass = "w-full rounded border border-zinc-300 px-3 py-1.5";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-500"
      >
        編集
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onCancel={(e) => {
          e.preventDefault();
          cancel();
        }}
        className="w-full max-w-md rounded-lg p-0 shadow-xl backdrop:bg-black/40 open:m-auto"
        aria-labelledby="edit-title"
      >
        <form action={formAction} className="p-6">
          <h2 id="edit-title" className="mb-4 text-lg font-semibold">
            商品を編集
          </h2>
          <input type="hidden" name="id" value={product.id} />
          <div className="mb-3">
            <span className="mb-1 block text-sm font-medium">code</span>
            <p className="font-mono text-zinc-600">{product.code}</p>
          </div>
          {field(
            "name",
            "name",
            <input
              id="edit-name"
              name="name"
              value={values.name}
              onChange={setField("name")}
              className={inputClass}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "edit-name-error" : undefined}
            />,
          )}
          {field(
            "category",
            "category",
            <input
              id="edit-category"
              name="category"
              value={values.category}
              onChange={setField("category")}
              className={inputClass}
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? "edit-category-error" : undefined}
            />,
          )}
          {field(
            "price",
            "price",
            <input
              id="edit-price"
              name="price"
              type="text"
              inputMode="numeric"
              value={values.price}
              onChange={setField("price")}
              className={inputClass}
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? "edit-price-error" : undefined}
            />,
          )}
          {field(
            "note",
            "note",
            <textarea
              id="edit-note"
              name="note"
              value={values.note}
              onChange={setField("note")}
              rows={3}
              className={inputClass}
            />,
          )}
          {state.status === "error" && state.message && (
            <p className="mb-3 text-sm text-red-600" role="alert">
              {state.message}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="rounded border border-zinc-300 px-4 py-1.5 hover:bg-zinc-100"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-blue-600 px-4 py-1.5 text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {pending ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
