"use client";

export function DeleteButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm("この商品を削除します。よろしいですか？")) {
          e.preventDefault();
        }
      }}
      className="rounded bg-red-600 px-4 py-1.5 text-white hover:bg-red-500"
    >
      削除
    </button>
  );
}
