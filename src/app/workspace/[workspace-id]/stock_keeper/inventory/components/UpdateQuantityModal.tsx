import { useState, useEffect } from "react";

interface UpdateQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { date: string; qty: number; method: string }) => void;
  defaultMethod?: string;
}

export default function UpdateQuantityModal({
  isOpen,
  onClose,
  onSubmit,
  defaultMethod = "Import",
}: UpdateQuantityModalProps) {
  const [date, setDate] = useState("");
  const [qty, setQty] = useState(0);
  const [method, setMethod] = useState(defaultMethod);

  useEffect(() => {
    if (isOpen) {
      setDate("");
      setQty(0);
      setMethod(defaultMethod);
    }
  }, [isOpen, defaultMethod]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 max-w-md w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h1 className="text-xl font-bold mb-4">Update Quantity</h1>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit?.({ date, qty, method});
            onClose();
          }}
          className="flex flex-col gap-4"
        >
          <label className="font-medium">Date</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
          <label className="font-medium">Quantity</label>
          <input
            type="number"
            className="border rounded px-3 py-2"
            value={qty}
            onChange={e => setQty(Number(e.target.value))}
            required
          />
          <label className="font-medium">Method</label>
          <select
            className="border rounded px-3 py-2 mb-10"
            value={method}
            onChange={e => setMethod(e.target.value)}
          >
            <option>Import</option>
          </select>
          <button
            type="submit"
            className="bg-primary text-white rounded px-4 py-2 font-semibold hover:bg-primary/90 transition"
          >
            Update
          </button>
        </form>
      </div>
    </div>
  );
}