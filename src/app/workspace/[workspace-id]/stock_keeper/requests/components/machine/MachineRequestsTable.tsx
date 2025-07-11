import { ArrowRightLeft, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import StatusBadge from '../StatusBadge';

interface MachineRequest {
  id: string;
  requestCode: string;
  requestDate: string;
  requestedBy: string;
  status: string;
  reason: string;
  currentMachineName: string;
  replacementMachineName: string;
  priority: string;
}

interface MachineRequestsTableProps {
  requests: MachineRequest[];
  onRequestClick: (id: string) => void;
  onClearFilters: () => void;
}

export default function MachineRequestsTable({ 
  requests, 
  onRequestClick, 
  onClearFilters 
}: MachineRequestsTableProps) {
  // Helper function to get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs font-medium">Cao</span>
          </div>
        );
      case 'Medium':
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="h-3 w-3" />
            <span className="text-xs font-medium">Trung bình</span>
          </div>
        );
      case 'Low':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            <span className="text-xs font-medium">Thấp</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-3 w-3" />
            <span className="text-xs font-medium">Chưa xác định</span>
          </div>
        );
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Không có yêu cầu thiết bị nào phù hợp với bộ lọc
        </p>
        <button
          className="mt-2 text-primary underline text-sm"
          onClick={onClearFilters}
        >
          Xóa tất cả bộ lọc
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-200">
            <th className="px-4 py-3 text-left font-medium">Mã yêu cầu</th>
            <th className="px-4 py-3 text-left font-medium">Ngày yêu cầu</th>
            <th className="px-4 py-3 text-left font-medium">Người yêu cầu</th>
            <th className="px-4 py-3 text-left font-medium">Thiết bị thay thế</th>
            <th className="px-4 py-3 text-left font-medium">Lý do</th>
            <th className="px-4 py-3 text-left font-medium">Độ ưu tiên</th>
            <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {requests.map((req) => (
            <tr
              key={req.id}
              className="hover:bg-primary/5 cursor-pointer transition-colors"
              onClick={() => onRequestClick(req.id)} 
            >
              <td className="px-4 py-3 font-medium">{req.requestCode}</td>
              <td className="px-4 py-3">{new Date(req.requestDate).toLocaleDateString('vi-VN')}</td>
              <td className="px-4 py-3">{req.requestedBy}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="text-xs">
                    <div className="font-medium text-red-600 mb-1">
                      {req.currentMachineName}
                    </div>
                    <div className="flex items-center justify-center mb-1">
                      <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                    </div>
                    <div className="font-medium text-green-600">
                      {req.replacementMachineName}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="max-w-32 truncate" title={req.reason}>
                  {req.reason}
                </div>
              </td>
              <td className="px-4 py-3">
                {getPriorityBadge(req.priority)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={req.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}