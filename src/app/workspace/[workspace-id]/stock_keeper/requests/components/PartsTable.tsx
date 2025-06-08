import { Check, AlertTriangle } from "lucide-react";
import { RequestPart } from "../../type";

interface PartsTableProps {
  parts: RequestPart[];
  showUnavailableForm: boolean;
  selectedPartIds: string[];
  isPartUnavailable: (partId: string) => boolean;
  onTogglePartSelection: (partId: string) => void;
}

export default function PartsTable({
  parts,
  showUnavailableForm,
  selectedPartIds,
  isPartUnavailable,
  onTogglePartSelection
}: PartsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-200">
            {showUnavailableForm && (
              <th className="px-4 py-2 text-left font-medium w-10">Select</th>
            )}
            <th className="px-4 py-2 text-left font-medium">Part ID</th>
            <th className="px-4 py-2 text-left font-medium">Part Name</th>
            <th className="px-4 py-2 text-left font-medium">Quantity Requested</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {parts.map((part) => (
            <tr 
              key={part.id} 
              className={`${showUnavailableForm && !isPartUnavailable(part.id) ? "cursor-pointer hover:bg-primary/5" : ""}`}
              onClick={() => {
                if (showUnavailableForm && !isPartUnavailable(part.id)) {
                  onTogglePartSelection(part.id);
                }
              }}
            >
              {showUnavailableForm && (
                <td className="px-4 py-3">
                  <input 
                    type="checkbox" 
                    checked={selectedPartIds.includes(part.id)}
                    onChange={() => onTogglePartSelection(part.id)}
                    disabled={isPartUnavailable(part.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </td>
              )}
              <td className="px-4 py-3 font-medium">{part.id}</td>
              <td className="px-4 py-3">{part.name}</td>
              <td className="px-4 py-3">{part.requested}</td>
              <td className="px-4 py-3">
                {isPartUnavailable(part.id) ? (
                  <div className="flex items-center text-red-500 gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium text-sm">Unavailable</span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-500 gap-1">
                    <Check className="h-4 w-4" />
                    <span className="font-medium text-sm">Available</span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}