import { Request } from '../../type';
import StatusBadge from './StatusBadge';

interface RequestsTableProps {
  requests: Request[];
  onRequestClick: (id: string) => void;
  onClearFilters: () => void;
}

export default function RequestsTable({ 
  requests, 
  onRequestClick, 
  onClearFilters 
}: RequestsTableProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No requests match your filters
        </p>
        <button
          className="mt-2 text-primary underline text-sm"
          onClick={onClearFilters}
        >
          Clear all filters
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-200">
            <th className="px-4 py-3 text-left font-medium">Request Code</th>
            <th className="px-4 py-3 text-left font-medium">Request Date</th>
            <th className="px-4 py-3 text-left font-medium">Requested By</th>
            <th className="px-4 py-3 text-left font-medium">Number of Items</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {requests.map((req) => (
            <tr
              key={req.id}
              className="hover:bg-primary/5 cursor-pointer transition-colors"
              onClick={() => onRequestClick(req.id)} 
            >
              <td className="px-4 py-3 font-medium">{req.code}</td> 
              <td className="px-4 py-3">{req.date}</td>
              <td className="px-4 py-3">{req.requestedBy}</td>
              <td className="px-4 py-3">{req.items}</td>
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