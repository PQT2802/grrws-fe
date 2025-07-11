import { Check } from "lucide-react";
import { RequestPart, UnavailablePart } from "../../../type";

interface UnavailablePartsDisplayProps {
  unavailableParts: UnavailablePart[];
  parts: RequestPart[];
  submittedUnavailable: boolean;
}

export default function UnavailablePartsDisplay({
  unavailableParts,
  parts,
  submittedUnavailable
}: UnavailablePartsDisplayProps) {
  if (unavailableParts.length === 0) return null;

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 className="font-medium mb-2">Báo cáo linh kiện không có sẵn</h3>
      
      {submittedUnavailable && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-sm">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4" />
            <span>Đã gửi thông báo cho Trưởng phòng Kỹ thuật</span>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {unavailableParts.map((part, index) => {
          const partDetail = parts.find(p => p.id === part.id);
          return (
            <div 
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-md p-3"
            >
              <div className="flex justify-between mb-2">
                <h4 className="font-medium">
                  {partDetail?.name} ({part.id})
                </h4>
              </div>
              <div className="text-sm">
                <p className="mb-1"><span className="text-gray-500">Lý do:</span> {part.reason}</p>
                <p><span className="text-gray-500">Dự kiến nhập kho:</span> {part.restockDate}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}