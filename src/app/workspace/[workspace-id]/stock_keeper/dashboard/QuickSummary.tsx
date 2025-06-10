const summaryData = [
  {
    label: "Total Requests Today",
    value: 8,
    color: "bg-blue-100 text-blue-700",
  },
  {
    label: "Out-of-stock Items",
    value: 2,
    color: "bg-red-100 text-red-700",
  },
  {
    label: "Pending Deliveries",
    value: 5,
    color: "bg-yellow-100 text-yellow-700",
  },
];

export default function QuickSummary() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {summaryData.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg shadow p-5 flex flex-col items-center ${item.color} dark:bg-opacity-80`}
        >
          <span className="text-3xl font-bold mb-1">{item.value}</span>
          <span className="text-sm font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
