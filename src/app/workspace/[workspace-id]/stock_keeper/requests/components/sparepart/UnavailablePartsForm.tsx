import { Calendar } from "lucide-react";

interface UnavailablePartsFormProps {
  selectedPartIds: string[];
  reason: string;
  restockDate: string;
  onReasonChange: (reason: string) => void;
  onRestockDateChange: (date: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function UnavailablePartsForm({
  selectedPartIds,
  reason,
  restockDate,
  onReasonChange,
  onRestockDateChange,
  onSubmit,
  onCancel
}: UnavailablePartsFormProps) {
  if (selectedPartIds.length === 0) {
    return (
      <p className="text-sm text-gray-500 mb-4">
        Vui lòng chọn ít nhất một linh kiện để đánh dấu là không có sẵn.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Lý do không có sẵn
          </label>
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
              focus:ring-primary focus:border-primary dark:bg-slate-700"
            rows={3}
            placeholder="Giải thích tại sao những linh kiện này không có sẵn..."
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            Ngày dự kiến nhập kho
          </label>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <input
              type="date"
              value={restockDate}
              onChange={(e) => onRestockDateChange(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                focus:ring-primary focus:border-primary dark:bg-slate-700"
              required
            />
          </div>
        </div>
        
        <div className="pt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded text-sm"
          >
            Gửi
          </button>
        </div>
      </div>
    </form>
  );
}