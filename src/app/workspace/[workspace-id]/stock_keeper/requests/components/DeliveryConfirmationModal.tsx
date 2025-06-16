import { useState, useEffect } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';

interface SparePartForDelivery {
  id: string;
  name: string;
  code: string;
  quantity: number;
  usageId: string; // This is the SparePartUsageId needed for the API
}

interface DeliveryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (partUsageIds: string[]) => void;
  parts: SparePartForDelivery[];
}

export default function DeliveryConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  parts
}: DeliveryConfirmationModalProps) {
  const [confirmedParts, setConfirmedParts] = useState<Set<string>>(new Set());
  
  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmedParts(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;
  
  // Toggle part confirmation
  const togglePart = (usageId: string) => {
    const newConfirmed = new Set(confirmedParts);
    if (newConfirmed.has(usageId)) {
      newConfirmed.delete(usageId);
    } else {
      newConfirmed.add(usageId);
    }
    setConfirmedParts(newConfirmed);
  };
  
  const allConfirmed = confirmedParts.size === parts.length;
  const usageIdsToConfirm = Array.from(confirmedParts);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 max-w-2xl w-full relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Confirm Parts Handover</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Please confirm that all spare parts have been handed over to the requester.
          Check each item to confirm its delivery.
        </p>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Confirm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Part Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Part Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
              {parts.map((part) => (
                <tr 
                  key={part.usageId} 
                  className="hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={() => togglePart(part.usageId)}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={confirmedParts.has(part.usageId)}
                        onChange={() => togglePart(part.usageId)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {part.code}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {part.name}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    {part.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!allConfirmed && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-3 rounded-md mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              Please confirm all items have been handed over by checking each row.
            </p>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!allConfirmed}
            onClick={() => onConfirm(usageIdsToConfirm)}
            className={`px-4 py-2 rounded text-sm ${
              allConfirmed 
                ? 'bg-primary text-white hover:bg-primary-dark' 
                : 'bg-gray-300 text-gray-700 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            Complete Handover
          </button>
        </div>
      </div>
    </div>
  );
}