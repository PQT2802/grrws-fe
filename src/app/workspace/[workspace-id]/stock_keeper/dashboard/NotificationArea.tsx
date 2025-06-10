const mockRequests = [
  {
    id: "REQ-001",
    mechanic: "Nguyen Van A",
    date: "2025-06-08",
    part: "Needle Bar",
    status: "New",
  },
  {
    id: "REQ-002",
    mechanic: "Tran Thi B",
    date: "2025-06-08",
    part: "Thread Guide",
    status: "New",
  },
  {
    id: "REQ-003",
    mechanic: "Le Van C",
    date: "2025-06-08",
    part: "Presser Foot",
    status: "New",
  },
];

export default function NotificationArea() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
      <h2 className="font-semibold text-lg mb-3">New Part Requests</h2>
      <ul className="divide-y divide-gray-200 dark:divide-slate-700">
        {mockRequests.map((req) => (
          <li key={req.id} className="py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-medium">{req.mechanic}</span> requested <span className="font-semibold">{req.part}</span>
              <span className="ml-2 text-xs text-gray-500">({req.date})</span>
            </div>
            <span className="inline-block mt-1 sm:mt-0 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded">{req.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
