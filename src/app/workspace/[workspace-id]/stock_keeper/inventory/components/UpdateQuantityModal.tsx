import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface UpdateQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { date: string; qty: number; method: string }) => void;
  defaultMethod?: string;
  currentQuantity?: number;
}

export default function UpdateQuantityModal({
  isOpen,
  onClose,
  onSubmit,
  defaultMethod = "Import",
  currentQuantity = 0
}: UpdateQuantityModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [qty, setQty] = useState(0);
  const [method, setMethod] = useState(defaultMethod);
  const [errors, setErrors] = useState<{qty?: string}>({});

  useEffect(() => {
    if (isOpen) {
      setDate(today);
      setQty(0);
      setMethod(defaultMethod);
      setErrors({});
    }
  }, [isOpen, defaultMethod, today]);

  // Modify the form submission to clarify what's happening
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: {qty?: string} = {};
    if (qty <= 0) {
      newErrors.qty = "Quantity must be positive";
    }
    
    if (method === "Export" && qty > currentQuantity) {
      newErrors.qty = `Cannot export more than current stock (${currentQuantity})`;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit the data
    onSubmit?.({ date, qty, method });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 max-w-md w-full relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Update Quantity</h1>
          <button
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2 dark:bg-slate-700 dark:border-gray-600"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              className={`w-full border rounded-md px-3 py-2 dark:bg-slate-700 dark:border-gray-600 ${
                errors.qty ? "border-red-500" : ""
              }`}
              value={qty}
              onChange={e => {
                setQty(Number(e.target.value));
                if (errors.qty) setErrors({});
              }}
              required
            />
            {errors.qty && (
              <p className="text-red-500 text-sm mt-1">{errors.qty}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Method</label>
            <select
              className="w-full border rounded-md px-3 py-2 dark:bg-slate-700 dark:border-gray-600"
              value={method}
              onChange={e => {
                setMethod(e.target.value);
                if (errors.qty) setErrors({});
              }}
            >
              <option value="Import">Import (Add to stock)</option>
              <option value="Export">Export (Remove from stock)</option>
              <option value="Adjustment">Adjustment (Stock count)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {method === "Import" ? "Adds quantity to current stock" :
               method === "Export" ? "Removes quantity from current stock" :
               "Sets stock to the exact quantity"}
            </p>
          </div>
          
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
            >
              Update Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}