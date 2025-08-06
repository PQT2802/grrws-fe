const mockLogs = [
  { date: "2025-06-08", part: "Needle Bar", qty: -2, method: "Export", by: "Stock Keeper", note: "Issued for repair" },
  { date: "2025-06-07", part: "Thread Guide", qty: 5, method: "Import", by: "Stock Keeper", note: "Restocked" },
  { date: "2025-06-06", part: "Presser Foot", qty: -1, method: "Export", by: "Stock Keeper", note: "Issued for replacement" },
];

export default function StockLogsPage() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h1 className="text-xl font-bold mb-4">Stock In/Out Logs</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-slate-700">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Part</th>
              <th className="px-4 py-2 text-left">Quantity</th>
              <th className="px-4 py-2 text-left">Method</th>
              <th className="px-4 py-2 text-left">Performed By</th>
              <th className="px-4 py-2 text-left">Note</th>
            </tr>
          </thead>
          <tbody>
            {mockLogs.map((log, i) => (
              <tr key={i}>
                <td className="px-4 py-2">{log.date}</td>
                <td className="px-4 py-2">{log.part}</td>
                <td className="px-4 py-2">{log.qty}</td>
                <td className="px-4 py-2">{log.method}</td>
                <td className="px-4 py-2">{log.by}</td>
                <td className="px-4 py-2">{log.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
