import { Check, AlertTriangle, XCircle } from "lucide-react";

interface RequestPart {
  id: string;
  name: string;
  requested: number;
  code?: string;
  stockQuantity?: number;
  specification?: string;
  isTakenFromStock?: boolean;
}

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
  // Helper function to determine part status
  const getPartStatus = (part: RequestPart) => {
    // First check if part was marked unavailable manually
    if (isPartUnavailable(part.id)) {
      return {
        status: "Unavailable",
        color: "text-red-500",
        icon: AlertTriangle
      };
    }
    
    // Check if we have enough in stock
    if (typeof part.stockQuantity === 'number') {
      if (part.stockQuantity < part.requested) {
        return {
          status: "Out of Stock",
          color: "text-amber-500",
          icon: XCircle
        };
      } else {
        return {
          status: "Available",
          color: "text-green-500",
          icon: Check
        };
      }
    }
    
    // Fallback for when no stock quantity info is available
    return {
      status: "Unknown",
      color: "text-gray-500",
      icon: AlertTriangle
    };
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-200">
            {showUnavailableForm && (
              <th className="px-4 py-2 text-left font-medium w-10">Select</th>
            )}
            <th className="px-4 py-2 text-left font-medium">Part Code</th>
            <th className="px-4 py-2 text-left font-medium">Part Name</th>
            <th className="px-4 py-2 text-left font-medium">Quantity Requested</th>
            <th className="px-4 py-2 text-left font-medium">In Stock</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {parts.map((part) => {
            // Get part status data
            const partStatus = getPartStatus(part);
            const StatusIcon = partStatus.icon;
            
            return (
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
                <td className="px-4 py-3 font-medium">{part.code || part.id}</td>
                <td className="px-4 py-3">
                  {part.name}
                  {part.specification && (
                    <p className="text-xs text-gray-500 mt-1">{part.specification}</p>
                  )}
                </td>
                <td className="px-4 py-3">{part.requested}</td>
                <td className="px-4 py-3">
                  {typeof part.stockQuantity === 'number' ? part.stockQuantity : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <div className={`flex items-center ${partStatus.color} gap-1`}>
                    <StatusIcon className="h-4 w-4" />
                    <span className="font-medium text-sm">{partStatus.status}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}