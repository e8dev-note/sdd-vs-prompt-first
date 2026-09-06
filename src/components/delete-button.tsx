"use client";

import { deleteProductAction } from "@/app/products/actions";

type Props = { id: number };

export function DeleteButton({ id }: Props) {
  return (
    <form
      action={deleteProductAction}
      onSubmit={(e) => {
        if (!window.confirm("この商品を削除しますか?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded border border-red-600 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        削除
      </button>
    </form>
  );
}
