"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { type EditState, updateProductAction } from "@/app/products/actions";
import type { Product } from "@/lib/products";

type Props = { product: Product };

type Values = { name: string; category: string; price: string; note: string };

function toValues(p: Product): Values {
  return { name: p.name, category: p.category, price: String(p.price), note: p.note ?? "" };
}

const INITIAL: EditState = { status: "idle" };

const inputClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 aria-[invalid=true]:border-red-600";

/** 編集ボタン + ネイティブ dialog。入力は制御コンポーネント(React 19 の action 後リセットを避ける)。 */
export function EditProductModal({ product }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [values, setValues] = useState<Values>(() => toValues(product));
  const [state, formAction, pending] = useActionState(updateProductAction, INITIAL);
  const lastSavedAt = useRef<string | null>(null);

  // 保存成功(savedAt が変わった)ならモーダルを閉じる。詳細の値は同じレスポンスで再描画済み。
  useEffect(() => {
    if (state.status === "success" && state.savedAt !== lastSavedAt.current) {
      lastSavedAt.current = state.savedAt;
      dialogRef.current?.close();
    }
  }, [state]);

  function openModal() {
    setValues(toValues(product));
    dialogRef.current?.showModal();
  }

  const errors = state.status === "error" ? state.errors : {};
  const formError = state.status === "error" ? state.formError : undefined;

  function field(
    key: keyof Values,
    label: string,
    extra: { autoFocus?: boolean; inputMode?: "numeric"; multiline?: boolean } = {},
  ) {
    const id = `edit-${key}`;
    const error = errors[key];
    const common = {
      id,
      name: key,
      value: values[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValues((v) => ({ ...v, [key]: e.target.value })),
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${id}-error` : undefined,
      className: inputClass,
    };
    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {extra.multiline ? (
          <textarea {...common} rows={3} />
        ) : (
          <input {...common} type="text" inputMode={extra.inputMode} autoFocus={extra.autoFocus} />
        )}
        {error && (
          <p id={`${id}-error`} className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        編集
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setValues(toValues(product))}
        className="w-full max-w-lg rounded border border-gray-200 bg-white p-0 text-gray-900 shadow-lg backdrop:bg-black/40 open:fixed open:top-1/2 open:left-1/2 open:-translate-x-1/2 open:-translate-y-1/2"
      >
        <form action={formAction} className="space-y-4 p-6">
          <h2 className="text-lg font-semibold">商品を編集</h2>
          {formError && (
            <p role="alert" className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
              {formError}
            </p>
          )}
          <input type="hidden" name="id" value={product.id} />
          <div className="space-y-1">
            <span className="block text-sm font-medium text-gray-700">code</span>
            <p className="font-mono text-sm text-gray-600">{product.code}</p>
          </div>
          {field("name", "name", { autoFocus: true })}
          {field("category", "category")}
          {field("price", "price", { inputMode: "numeric" })}
          {field("note", "note", { multiline: true })}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {pending ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
